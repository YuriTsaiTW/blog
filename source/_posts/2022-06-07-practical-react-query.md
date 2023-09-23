---
title: "[譯] #1 React Query 的實用技巧" 
date: 2022-06-07 16:22:49
categories: 軟體開發
cover: /%E8%BB%9F%E9%AB%94%E9%96%8B%E7%99%BC/2022060716/cover.png
thumbnail: /%E8%BB%9F%E9%AB%94%E9%96%8B%E7%99%BC/2022060716/cover.png
tags: [React Query]
keywords: React Query，Apollo，GraphQL, REST，React
comments: false
toc: true
---

{% blockquote %}
本篇文章翻自 [Practical React Query](https://tkdodo.eu/blog/practical-react-query)
謝謝 [@TkDodo](https://github.com/tkdodo) 撰寫 React Query 的優質系列文，並且開放各方翻譯。
{% endblockquote %}

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
考量到語句通暢性，部分詞句不會完全貼切原意；另外專有名詞會依照個人習慣，適當地翻譯成中文或是維持英文，如果有詞不達意或錯誤的地方歡迎提出 👋
</div>
</article>

當 GraphQL 和 [Apollo Client](https://www.apollographql.com/docs/react/) 大約在 2018 年流行起來時，有不少人認爲 Redux 會被取代，也常有人問 [Redux 現在還活著嗎？](https://dev.to/markerikson/redux---not-dead-yet-1d9k)

我記得當時對於這樣的狀況有點不解，為什麼 fetch 資料的函式庫會取代狀態管理工具呢？這兩者之間有什麼關係？

以我的印象，像 Apollo 這樣的 GraphQL client 只會幫你 fetch 資料，就跟 axios 之於 REST API。因此還是需要透過一些方式讓應用可以存取到資料。

但我大錯特錯了。

## Client State 和 Server State

Apollo 不僅可以讓你描述要抓的資料輪廓，對於這份 Server 來的資料也有 cache 的機制。也就是說當你在多個元件中使用相同的 `useQuery`  hook，Apollo 可以只發出一次的請求取得資料並製作 cache，後續元件要存取這份資料時，Apollo 就以這份 cache 回傳。

這對大家來說其實耳熟能詳，這就像我們用 Redux 在做的事情：從 Server 抓資料，並且在各處可以存取到。

這樣看起來的話，我們其實一直把 Server State 當作是 Client State 來處理。思考一下，你從 Server 抓了文章列表和使用者的詳細資訊等這些資料，你的應用並沒有擁有它們，而是借用它們的最新版本呈現給使用者。Server 才是實際上擁有這些資料的一方。

對我來說，這帶來了全新的思維和典範轉移，讓我重新思考對於資料的處理方式。如果應用本身可以不用擁有資料，就可以適當地使用 cache 機制呈現，就不需要以 Client State 的方式處理，才能讓整個應用都能存取到。這讓我理解為什麼許多人會覺得，在多數情況下，Apollo 可以取代 Redux。

## React Query

我沒有使用 GraphQL 的經驗。我們有一個既有的 REST API 可以正常運作，也沒有遇過 over-fetching 的問題。顯然並沒有產生足夠的痛點讓我們一定得轉換，尤其是你還得說服後端，這不是件簡單的事。

不過我還是很嚮往前端可以用簡潔的方式抓資料，包括處理載入中和錯誤的狀態，如果這在使用 REST API 的 React 應用之下有類似的 ...

讓我們正式進入到 [React Query](https://react-query.tanstack.com/) 的環節。

React Query 由開源社群裡的 [Tanner Linsley](https://github.com/tannerlinsley) 在 2019 年底發布，並將 Apollo 的優點帶進 REST 的開發模式。它能以任何的函式形式運作，並回傳一個 Promise。React Query 採用 [stale-while-revalidate](https://ithelp.ithome.com.tw/articles/10280724) 的 cache 策略，它會以合理的預設設定進行操作，讓你的資料盡可能是最新的狀態，但也盡可能地即時呈現給使用者，提供良好的使用者體驗。最重要的是，當預設的行為無法滿足需求時，React Query 也提供充足的設定進行客製化，相當地彈性。

不過這篇文章並不會對 React Query 進行基本的介紹。

我認為官方文件已經有很好的觀念解釋和語法指示，你可以觀看各種的談話性[影片](https://react-query.tanstack.com/docs/videos)，以及 Tanner 製作的官方[課程](https://learn.tanstack.com/)，你可以藉由以上這些教材來熟悉這個函式庫。

接下來的重點放在一些實用技巧來作為官方文件的延伸，對於已經在用 React Query 的你或許會有點用處。這些實用技巧是我在過去幾個月以來，從工作上或是參與 React Query 社群時，在 Discord 的問答和在 GitHub 中發起的討論整理而來的。

## 對於預設行為的解釋

我相信 React Query 的 [預設行為](https://react-query.tanstack.com/docs/guides/important-defaults) 已經很理想，不過有時候這些行為反而會讓你措手不及、陷入混亂，尤其是新手。

首先，React Query 並不會在每次的渲染下 invoke queryFn，即使 `staleTime` 是預設的 0。你的應用會在任何時間根據各種原因重新渲染，所以每次的渲染都進行 fetching 是非常不理想的事。

如果你遇到非預期的 refetch，這有可能只是因為當你 focus window 時，React Query 會執行 `refetchOnWindowFocus` 的事件，這對於正式環境來說是個理想的功能：當使用者從瀏覽器的其他分頁返回你的應用頁時，就會自動觸發背景的更新，當 Server 有資料變動時，畫面上就會顯示最新的資料狀態。上述發生的過程中並不會呈現載入中的 UI，而且如果你的資料是來自 cache 的話，元件也不會重複渲染。

需要注意的是，在開發過程中，我們會頻繁地切換瀏覽器開發工具以及應用頁，這樣的動作也會觸發 `refetchOnWindowFocus` ，造成更頻繁的 refetch。

再來，對於 `staleTime` 和 `cacheTime` 很容易產生混淆 ，所以我試著疏理一下這兩者的意思－
- `staleTime`： query 從有效到過期所經過的時間。只要這份 query 在有效期間內，資料總是會從 cache 中取得，不會發生任何的網路請求。如果這份 query 過期了（預設值為 0，也就是在產生 query 的當下就馬上過期了），你還是會從 cache 中取得資料，不過在 [某些條件下](https://react-query.tanstack.com/docs/guides/caching) 會在背景執行 refetch。
- `cacheTime`： 一旦沒有任何的 observer 註冊（當所有有用到 query 的元件都 unmounted）， query 會進到 inactive 的狀態，然後會隔一段時間後就會從 cache 中清除。預設是 5 分鐘。

## 使用 React Query 的開發者工具
這將會幫助你很好地瞭解 query 的狀態變化。這個開發者工具也可以讓你知道目前 cache 的資料內容是什麼。所以你可以更容易地進行除錯。除此之外，我發現瀏覽器的開發者工具可以對 network connection 進行 throttle，來測試在不同的網路環境下執行背景 refetch 的狀況，畢竟在一般的開發環境下總是很快速。

## 把 query key 當作是 dependency array

在這裡我會引用 [`useEffect`](https://reactjs.org/docs/hooks-reference.html#conditionally-firing-an-effect) hook 的 dependency array 的觀念來說明，我假設你已經對它熟悉了。

為什麼這兩件事情會很類似呢？

因為當 query key 變動時，React Query 就會觸發 refetch，所以當我們以一個變數作為 queryFn 的參數時，會希望一旦變數值更新，queryFn 就會執行 fetch 資料的動作。我們可以利用 query key 來做到這件事，而不是組織複雜的 effects 並手動地觸發 refetch。

```typescript feature/todos/queries.ts
type State = 'all' | 'open' | 'done'
type Todo = {
  id: number
  state: State
}
type Todos = ReadonlyArray<Todo>

const fetchTodos = async (state: State): Promise<Todos> => {
  const response = await axios.get(`todos/${state}`)
  return response.data
}

export const useTodosQuery = (state: State) =>
  useQuery(['todos', state], () => fetchTodos(state))
```

在這個例子，我們想像畫面呈現待辦事項的列表，並且有篩選的選項。我們會有一些 local state 去儲存篩選後的狀態，一旦使用者切換選項時，我們可以更新 local state。而切換選項會導致 query key 的變動， React Query 將會自動地為我們觸發 refetch。因此我們可以將使用者的篩選選項和對應的 query 函式保持在同步的狀態，這就像是 dependency array 之於 `useEffect`一樣。

## 新的 cache entry

因為 query key 會被當作 cache key，當你第一次從 'all' 的狀態切換成 'done' 時，就會產生新的 cache entry，並且在過程中產生載入中的狀態（或許畫面會呈現載入中的圖示），這可不理想。所以在這樣的情況中，你可以使用 `keepPreviousData` 的選項，或者可能的話，以 `initialData` 預先為這份新的 cache entry 建立初始資料。

```typescript pre-filtering
type State = 'all' | 'open' | 'done'
type Todo = {
  id: number
  state: State
}
type Todos = ReadonlyArray<Todo>

const fetchTodos = async (state: State): Promise<Todos> => {
  const response = await axios.get(`todos/${state}`)
  return response.data
}

export const useTodosQuery = (state: State) =>
  useQuery(['todos', state], () => fetchTodos(state), {
    initialData: () => {
      const allTodos = queryClient.getQueryData<Todos>(['todos', 'all'])
      const filteredData =
        allTodos?.filter((todo) => todo.state === state) ?? []

      return filteredData.length > 0 ? filteredData : undefined
    },
  })
```

## 將 Server State 與 Client State 保持分離

這件事情跟我在上個月寫的文章－[putting-props-to-use-state](https://tkdodo.eu/blog/putting-props-to-use-state) 有密切的相關。如果你從 `useQuery` 取得資料，那麼不要嘗試將這份資料放進 local state。主要原因是這樣做等同默認你要屏棄所有 React Query 做的機制，因為當你放進 local state 後，你操作的就只是這份資料的「副本」，因此無法進行更新。

不過有些情況是允許這樣做的。例如為表單的欄位 fetch 預設資料，在資料準備就好就渲染表單元件。如果你是刻意要這麼做，請確保避免不必要的背景 refetch，你可以藉由設定 `staleTime` 來達成。

```jsx initial-form-data
const App = () => {
  const { data } = useQuery('key', queryFn, { staleTime: Infinity })

  return data ? <MyForm initialData={data} /> : null
}

const MyForm = ({ initialData} ) => {
  const [data, setData] = React.useState(initialData)
  ...
}
```

當你想呈現一份允許使用者進行編輯的資料時，其中有個觀念在實踐上會有點難度。我在 codesandbox 上放了一個範例程式：

<iframe src="https://codesandbox.io/embed/separate-server-and-client-state-rp3jx?fontsize=14&hidenavigation=1&theme=dark"
     style="width:100%; height:500px; border:0; border-radius: 4px; overflow:hidden;"
     title="separate-server-and-client-state"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>

在這個 demo 中有一個重點是，我們絕不會把從 React Query 來的值放進 local state 裡。這樣可以確保我們總是可以看到最新的資料，畢竟我們不是用複製到 local state 的方式來呈現。

## 強大的 `enabled` 選項

`useQuery` hook 有許多的設定可以客製化它的行為。其中有個 `enabled` 的選項可以做蠻多很酷的事。在這裡簡單整理以下可以透過這個選項做到的事：

- [具有相依性的 query](https://react-query.tanstack.com/guides/dependent-queries)：當有多個 query 設定相依性後，前一個 query 必須成功執行並取得資料，下一個 query 才會接續執行。
- 控制 query 的開關狀態：多虧有 `refetchInterval`，我們可以讓 query 自動定期地執行。但在某些情況下，例如 UI 顯示 modal 時，為了避免背後的畫面更新，我們可以暫停執行 query。
- 等待使用者的輸入：在 query key 中有些篩選的標準，不過一旦使用者沒有要採用的話就可以不用。
- 在某些使用者輸入的情況下不採用 query：我們可以優先使用 draft 值來取代從 Server 來的資料。可以參考上面的 demo。

## 不要使用 `queryCache` 作為本地狀態的管理工具

如果要自行修改 `queryCache（queryClient.setQueryData）`，你應該只能在符合 [optimistic update](https://react-query.tanstack.com/guides/optimistic-updates) 的條件下執行，或者進行 mutation 後，以 Server 回傳的資料來寫入。要記住每一次在背景發生 refetch 時都有可能覆蓋到資料，所以請使用其他方式來管理應用本身的狀態（Client State），像是 [state hook](https://reactjs.org/docs/hooks-state.html), [zustand](https://zustand.surge.sh/), [Redux](https://redux.js.org/) 等等。

## 建立自訂的 hook

就算只是把 `useQuery` 的呼叫再包一層起來，建立自訂的 hook 還是有好處，原因如以下－
- 你可以將實際發生資料請求的行為從 UI 中抽出來，並在 `useQuery` 中管理。
- 你可以在一個檔案裡集中所有對同個 query key 的使用（可能還有型別定義）。
- 如果需要調整一些設定或者對資料進行轉換，你可以集中一個地方實作。

## 其他參考來源
- [[npm] react-query | PJCHENder 未整理筆記](https://pjchender.dev/npm/npm-react-query/#staletime-vs-cachetime)
- [React Query Tutorial | 前端癢癢 der](https://chihyang41.github.io/2020/09/07/React-Query-Tutorial/)
