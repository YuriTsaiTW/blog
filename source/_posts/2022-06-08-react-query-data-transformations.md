---
title: "[譯] #2 React Query 的資料轉換" 
date: 2022-06-08 18:20:51
categories: 軟體開發
cover: /%E8%BB%9F%E9%AB%94%E9%96%8B%E7%99%BC/2022060818/cover.jpeg
thumbnail: /%E8%BB%9F%E9%AB%94%E9%96%8B%E7%99%BC/2022060818/cover.jpeg
tags: [React Query]
keywords: React Query，React
comments: false
toc: true
---

{% blockquote %}
本篇文章翻自 [React Query Data Transformations](https://tkdodo.eu/blog/react-query-data-transformations)
謝謝 [@TkDodo](https://github.com/tkdodo) 撰寫 React Query 的優質系列文，並且開放各方翻譯。

(封面圖由 [Joshua Sukoff](https://unsplash.com/@joshuas) 提供)
{% endblockquote %}

<!-- more -->

<article class="message message-immersive is-primary">
<div class="message-body">
考量到語句通暢性，部分詞句不會完全貼切原意；另外專有名詞會依照個人習慣，適當地翻譯成中文或是維持英文，如果有詞不達意或錯誤的地方歡迎提出 👋
</div>
</article>

歡迎來到「關於 React Query 我想說的事情」 part 2。由於我參與這個函式庫和相關社群的程度愈來愈深，我觀察到人們常問特定方面的問題。原本我是想要用一篇長文的形式寫完，不過我後來決定將這些問題分門別類，寫成不同的文章。第一篇的主題相當地普遍並且很重要：資料轉換。

## 資料轉換

### 0. 從後端來看

可以達成的話，這會是我最喜歡的方式。如果後端回傳的資料正好符合前端的需求，我們就不用再多做什麼。然而在許多情況下，這聽起來或許不太實際。例如我們需要串接公開的 REST APIs，而且這也有可能在企業級應用中會碰到。如果你對於後端有掌控權，而且可以控制 enpoint 回傳的資料剛好符合你的使用情境，請盡量使用者這個方式。

🟢   無法運用在前端。
🔴   並不是百分之百可行。

### 1. 在 `queryFn` 中

`queryFn` 是一個你會傳入到 `useQuery`的函式，並且會希望你回傳一個 Promise。Promise 中的結果資料會被作為 query cache。不過這並不代表你必須完全按照後端的形式回傳。你可以在回傳前先進行轉換，像這樣子：

```typescript queryFn-transformation
const fetchTodos = async (): Promise<Todos> => {
  const response = await axios.get('todos')
  const data: Todos = response.data

  return data.map((todo) => todo.name.toUpperCase())
}

export const useTodosQuery = () => useQuery(['todos'], fetchTodos)
```

在前端處理這份資料時，就會有種「這就像是直接從後端取得」的感覺。在你的應用中不需要額外處理那些開頭沒有大寫的代辦項目名稱。不過你會沒有權限去存取於原本的資料結構。如果你看 React Query 的開發者工具，你會看到已經轉換過的資料結構。但如果你看 network 的請求過程，則是會看到原本的資料結構。這或許會令人疑惑，所以先把這樣的方式放在心中吧。

🟢   按照 co-location 的概念，符合因「與後端高度相關」，所以盡可能放置在靠近抓資料的地方。
🟡   資料會在存入 cache 前就轉換完成，所以你沒有權限存取原本的資料結構。
🔴   每次進行 fetch 時都會執行到。
🔴   如果你有共用 api 層的設計，而且無法輕易修改的話，這方式並不可行。


### 2. 在 `render` 中

在 [Part 1](https://yuri-journal.me/%E8%BB%9F%E9%AB%94%E9%96%8B%E7%99%BC/2022060716/) 的建議中有提到，如果你建立自訂的 hooks，你可以輕易地對資料進行轉換：

```typescript render-transformation
const fetchTodos = async (): Promise<Todos> => {
  const response = await axios.get('todos')
  return response.data
}

export const useTodosQuery = () => {
  const queryInfo = useQuery(['todos'], fetchTodos)

  return {
    ...queryInfo,
    data: queryInfo.data?.map((todo) => todo.name.toUpperCase()),
  }
}
```

以目前來說，這不僅會在每次執行 fetch 時就轉換一次，還會在每次的渲染時（甚至有些渲染跟抓資料並沒有關係）也會執行到。這可能根本不是個問題，但如果是的話，你可以使用 `useMemo` 進行優化。需要注意的是，定義的 dependencies 盡量是愈少愈好。在 `queryInfo` 裡的 `data`會是穩定不變的，一直到某些東西改變（在這種情況下你會想要重新轉換得到新的資料）。
__

```typescript useMemo-dependencies
export const useTodosQuery = () => {
  const queryInfo = useQuery(['todos'], fetchTodos)

  return {
    ...queryInfo,
    // 🚨 don't do this - the useMemo does nothing at all here!
    data: React.useMemo(
      () => queryInfo.data?.map((todo) => todo.name.toUpperCase()),
      [queryInfo]
    ),

    // ✅ correctly memoizes by queryInfo.data
    data: React.useMemo(
      () => queryInfo.data?.map((todo) => todo.name.toUpperCase()),
      [queryInfo.data]
    ),
  }
}
```

這會是個理想的方式，尤其是你需要在自訂 hook 裡加入額外的邏輯來處理資料轉換時。但是需要注意資料有可能是 `undefined`，所以請使用 [optional chaining](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Operators/Optional_chaining) 來處理。

🟢   透過 `useMemo` 優化。
🟡   開發者工具無法檢查到最後精確的資料結構。
🔴   語法會有點迂迴。
🔴   資料有可能會是 `undefined`。

### 3. 使用 `select` 選項

在 v3 有引入了內建的選擇器（selectors），我們可以用它來進行資料的轉換：

```typescript select-transformation
export const useTodosQuery = () =>
  useQuery(['todos'], fetchTodos, {
    select: (data) => data.map((todo) => todo.name.toUpperCase()),
  })
```

當 `data` 存在時，選擇器才會被呼叫到，所以你不用擔心 `undefined` 的情況。以上述例子的選擇器來說，由於每次渲染時函式實體都會改變（它是 inline 函式），所以在每次渲染時都會執行到。如果你的資料轉換的成本很高（需要進行複雜的運算），你可以 memoize 選擇器函式，像是使用 `useCallback` 或者讓他參考到既有的函式實體。

```typescript select-memoizations
const transformTodoNames = (data: Todos) =>
  data.map((todo) => todo.name.toUpperCase())

export const useTodosQuery = () =>
  useQuery(['todos'], fetchTodos, {
    // ✅ uses a stable function reference
    select: transformTodoNames,
  })

export const useTodosQuery = () =>
  useQuery(['todos'], fetchTodos, {
    // ✅ memoizes with useCallback
    select: React.useCallback(
      (data: Todos) => data.map((todo) => todo.name.toUpperCase()),
      []
    ),
  })
```

除此之外，`select` 選項可以用來只訂閱部分的資料。這也是這個方式獨特的地方。思考以下的範例程式：

```typescript select-partial-subscriptions
export const useTodosQuery = (select) =>
  useQuery(['todos'], fetchTodos, { select })

export const useTodosCount = () => useTodosQuery((data) => data.length)
export const useTodo = (id) =>
  useTodosQuery((data) => data.find((todo) => todo.id === id))
```

在這裡，我們建立了類似 [Redux－useSelector](https://react-redux.js.org/api/hooks#useselector) 的 API，並且呼叫了 `useTodosQuery` 以及傳入自訂的選擇器。如果你沒有傳入自訂的選擇器，這個自訂 hook 一樣可以運作，他會回傳所有的資料狀態。

不過如果你傳入一個選擇器，你就只會訂閱到這個選擇器函式的執行結果。這會非常的強大，因為這代表即使我們更新某個待辦項目的名稱，只有透過 `useTodosCount` 訂閱待辦項目的數量的元件並不會被重新渲染。由於數量的值並沒有改變，所以 React Query 可以選擇不要通知觀察者更新 🥳 (請注意一下這裡是簡化過的說明，就技術上來說並不完全正確－我會在 Part 3 說得更仔細)。

🟢   最好的優化方式。
🟢   可以允許部分的訂閱。
🟡   可以根據不同的觀察者組織不同的轉換方式。
🟡   結構式共享會被執行兩次(我會在 Part 3 提到更多細節)。


