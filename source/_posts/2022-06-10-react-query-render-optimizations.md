---
title: "[譯] #3 React Query 的優化" 
date: 2022-06-10 17:36:18
categories: 軟體開發
cover: /%E8%BB%9F%E9%AB%94%E9%96%8B%E7%99%BC/2022061017/cover.jpeg
thumbnail: /%E8%BB%9F%E9%AB%94%E9%96%8B%E7%99%BC/2022061017/cover.jpeg
tags: [React Query]
keywords: React Query，React
comments: false
toc: true
---

{% blockquote %}
本篇文章翻自 [React Query Render Optimizations](https://tkdodo.eu/blog/react-query-render-optimizations)
謝謝 [@TkDodo](https://github.com/tkdodo) 撰寫 React Query 的優質系列文，並且開放各方翻譯。

(封面圖由 [Lukasz Szmigiel](https://unsplash.com/@szmigieldesign) 提供)
{% endblockquote %}

<!-- more -->

聲明：在任何的應用裡，優化渲染的部分是屬於進階的概念。React Query 在原生上已經有非常好的優化和預設行為，所以不需要再進一步地優化。許多人會放不少心思在「不需要的重複渲染」的主題上，這也是我決定要整理這篇文章的原因。不過我想重申一次，在大部分的應用中，優化渲染或許並沒有你想像中的茲事體大。重複渲染是件好事。他會讓你的應用總是在最新的狀態。相對於「缺少應該要有的渲染」，我更加可以接受「不必要的重複渲染」。關於這個主題的更多延伸，請閱讀以下兩篇文章：

- [Fix the slow render before you fix the re-render](https://kentcdodds.com/blog/fix-the-slow-render-before-you-fix-the-re-render)
- [this article by @ryanflorence about premature optimizations](https://cdb.reacttraining.com/react-inline-functions-and-performance-bdff784f5578)

---

當我在 [[譯] #2 React Query 的資料轉換](https://yuri-journal.me/%E8%BB%9F%E9%AB%94%E9%96%8B%E7%99%BC/2022060818/)中說明 `select` 選項時，已經有稍微帶到效能優化的部分。然而，「就算資料沒有改變，為什麼 React Query 還是會重複渲染元件」這個問題是我最常被問到的。所以讓我再試著深入解釋。

## `isFetching` 的轉換

我必須要誠實地說，在[上個例子](https://yuri-journal.me/%E8%BB%9F%E9%AB%94%E9%96%8B%E7%99%BC/2022060818/#3-%E4%BD%BF%E7%94%A8-select-%E9%81%B8%E9%A0%85)中有說過只當有待辦項目的數量變動時，元件才會再次渲染。

```typescript  count-component
export const useTodosQuery = (select) =>
  useQuery(['todos'], fetchTodos, { select })
export const useTodosCount = () => useTodosQuery((data) => data.length)

function TodosCount() {
  const todosCount = useTodosCount()

  return <div>{todosCount.data}</div>
}
```

每次在做背景的 refetch 時，元件會根據以下的 query 資訊重複渲染兩次：

```
{ status: 'success', data: 2, isFetching: true }
{ status: 'success', data: 2, isFetching: false }
```

這是因為 React Query 對於每個 query 會暴露許多 meta 資訊，`isFetching` 就是其中之一。當資料請求還在進行中的時候，這個 flag 就會維持 `true`。如果你想要在這種時候在畫面的背景中呈現載入中的指示時，這個會相當好用。不過如果你不用特別呈現載入中狀態的話，這個就會有點不太需要。

### `notifyOnChangeProps`

針對這樣的情況，React Query 有提供 `notifyOnChangeProps` 的選項。這個會在每個觀察者中進行指定，告訴 React Query 說，只有列表中的任一 prop 有更新，才需要通知觀察者這次的變動。藉由把設定這個選項設成 `[data]`，我們就能達到想要的優化。

``` typescript optimized-with-notifyOnChangeProps
export const useTodosQuery = (select, notifyOnChangeProps) =>
  useQuery(['todos'], fetchTodos, { select, notifyOnChangeProps })
export const useTodosCount = () =>
  useTodosQuery((data) => data.length, ['data'])
```

你可以在文件中的例子－[optimistic-updates-typescript](https://github.com/TanStack/query/blob/9023b0d1f01567161a8c13da5d8d551a324d6c23/examples/optimistic-updates-typescript/pages/index.tsx#L35-L48) 看到實際的應用。

### 保持同步（sync）

雖然以上的方式可以很好地運作，但是容易產生不同步的情況。但如果我們也想對錯誤進行反應的話該怎麼辦呢？或者我們想開始用 `isLoading` 的 flag？我們必須要讓 `notifyOnChangeProps` 裡的列表和我們在元件中實際使用的地方保持同步。如果我們忘記這件事，只有觀察到 data，但在渲染我們有用到 error。一旦有錯誤時，我們的元件並不會重複渲染。如果在我們自訂的 hook hard-code 的話會特別的麻煩，因為這個 hook 並不會知道元件實際上會運用到什麼：

```typescript outdated-component
export const useTodosCount = () =>
  useTodosQuery((data) => data.length, ['data'])

function TodosCount() {
  // 🚨 we are using error, but we are not getting notified if error changes!
  const { error, data } = useTodosCount()

  return (
    <div>
      {error ? error : null}
      {data ? data : null}
    </div>
  )
}
```

### Tracked Queries

我非常地以這個 feature 自豪，因為這是我在這個函式庫中第一個主要的貢獻。如果你把 `notifyOnChangeProps` 設成 `tracked`，React Query 會對在渲染過程中會用到的欄位持續地追蹤。你也可以在全域開啟這個選項讓全部的 queries 適用這項設定。

```typescript tracked-queries
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      notifyOnChangeProps: 'tracked',
    },
  },
})
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  )
}
```

有了這個，你再也不用思考有關重複渲染的事情。當然，追蹤使用到的欄位會需要花些運算的成本，所以當你要廣泛使用的話要確認一下。Tracked queries 也有一些限制，這也是為什麼這是的選用的 feature：

- 如果你使用[物件的剩餘運算子進行解構](https://github.com/tc39/proposal-object-rest-spread/blob/6ee4ce3cdda246746fc46fb149bb8b43c28e704d/Rest.md)，你會有效地觀察到每個欄位。一般的解構可以正常運作，只要做要做這件事：

```typescript problematic-rest-destructuring
// 🚨 will track all fields
const { isLoading, ...queryInfo } = useQuery(...)

// ✅ this is totally fine
const { isLoading, data } = useQuery(...)
```

- Tracked queries 只會在「渲染過程中」作用。如果你只是想在進行 effects 的時候存取欄位，這些欄位並不會被追蹤。以下是個邊際案例：

```typescript tracking-effects
const queryInfo = useQuery(...)

// 🚨 will not corectly track data
React.useEffect(() => {
    console.log(queryInfo.data)
})

// ✅ fine because the dependency array is accessed during render
React.useEffect(() => {
    console.log(queryInfo.data)
}, [queryInfo.data])
```

- Tracked queries 在每次的渲染並不會進行重置。因此一旦你追蹤了某個欄位，在觀察者的存活期間，你將會持續地追蹤他。

```typescript no-reset
const queryInfo = useQuery(...)

if (someCondition()) {
    // 🟡 we will track the data field if someCondition was true in any previous render cycle
    return <div>{queryInfo.data}</div>
}
```

更新：從 v4 開始，在 React Query 的預設行為中，tracked queries 會被開啟。你可以透過設定 `notifyOnChangeProps: 'all'` 選擇性地關閉這個 feature。

## 結構性共享（Structural sharing）

雖然是不同的事情，但是跟渲染優化一樣重要，並且在 React Query 中預設開啟支援的是「結構性共享（Structural sharing）」。這個 feature 會確保我們在每個層級中，都能持續地參考到資料的實體。在這個範例中，假設你擁有以下這樣的資料結構：

```json
[
  { "id": 1, "name": "Learn React", "status": "active" },
  { "id": 2, "name": "Learn React Query", "status": "todo" }
] 
```

現在，假設我們將第一個待辦項目的 `status` 轉換成 `done`，並且我們要在背景 refetch。我們將會從後端取得完整全新的資料：

```diff
[
-  { "id": 1, "name": "Learn React", "status": "active" },
+  { "id": 1, "name": "Learn React", "status": "done" },
  { "id": 2, "name": "Learn React Query", "status": "todo" }
]
```

現在 React Query 將會試圖比較新的跟舊的資料，並且盡可能地維持之前的狀態。在我們的例子中，這個待辦項目的陣列將會是以新的為主，因為我們更新了一個待辦項目。 id 為 1 的物件將會是新的，不過 id 為 2 的物件將會跟之前的狀態是一致的參考－因為他並沒有產生任何變動，React Query 只會把參考複製到新的結果上。

當我們要部分訂閱資料時，使用 selectors 會非常地方便：

```typescript optimized-selectors
// ✅ will only re-render if _something_ within todo with id:2 changes
// thanks to structural sharing
const { data } = useTodo(2)
```

如同我之前提示過的，對於 selector 來說，結構性共享會執行兩次：一次是根據 queryFn 回傳的結果來判斷是否有任何變動；再一次是 selector 函式回傳的結果。在某些情況下，尤其是當有非常龐大的資料集時，結構性共享反而會成為效能瓶頸。如果你不需要這項優化，你可以在任何的 query 中設定 `structuralSharing: false` 來關閉。

如果你想要了解背後運作的原理，可以看這個 [replaceEqualDeep tests](https://github.com/tannerlinsley/react-query/blob/80cecef22c3e088d6cd9f8fbc5cd9e2c0aab962f/src/core/tests/utils.test.tsx#L97-L304)。