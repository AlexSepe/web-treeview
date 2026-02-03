import { FeatureImplementation } from "@headless-tree/core";
import { SearchFeatureDataRef } from "@headless-tree/core";
import { makeStateUpdater } from "@headless-tree/core";
import { memo } from "../utils";

export const searchFeatureCustom: FeatureImplementation = {
  key: "search",

  getInitialState: (initialState) => ({
    search: null,
    ...initialState,
  }),

  getDefaultConfig: (defaultConfig, tree) => ({
    setSearch: makeStateUpdater("search", tree),
    isSearchMatchingItem: (search, item) =>
      search.length > 0 &&
      item.getItemName().toLowerCase().includes(search.toLowerCase()),
    ...defaultConfig,
  }),

  stateHandlerNames: {
    search: "setSearch",
  },

  treeInstance: {
    setSearch: ({ tree }, search) => {
      tree.applySubStateUpdate("search", search);
      tree
        .getItems()
        .find((item) =>
          tree.getConfig().isSearchMatchingItem?.(tree.getSearchValue(), item),
        )
        ?.setFocused();
    },
    openSearch: ({ tree }, initialValue = "") => {
      tree.setSearch(initialValue);
      tree.getConfig().onOpenSearch?.();
      setTimeout(() => {
        tree.getDataRef<SearchFeatureDataRef>().current.searchInput?.focus();
      });
    },
    closeSearch: ({ tree }) => {
      tree.setSearch(null);
      tree.getConfig().onCloseSearch?.();
      //tree.updateDomFocus();
    },
    isSearchOpen: ({ tree }) => tree.getState().search !== null,
    getSearchValue: ({ tree }) => tree.getState().search || "",
    registerSearchInputElement: ({ tree }, element) => {
      const dataRef = tree.getDataRef<SearchFeatureDataRef>();
      dataRef.current.searchInput = element;
      if (element && dataRef.current.keydownHandler) {
        element.addEventListener("keydown", dataRef.current.keydownHandler);
      }
    },
    getSearchInputElement: ({ tree }) =>
      tree.getDataRef<SearchFeatureDataRef>().current.searchInput ?? null,

    // TODO memoize with propMemoizationFeature
    getSearchInputElementProps: ({ tree }) => ({
      value: tree.getSearchValue(),
      onChange: (e: any) => tree.setSearch(e.target.value),
      onBlur: () => tree.closeSearch(),
      ref: tree.registerSearchInputElement,
    }),

    getSearchMatchingItems: memo(
      ({ tree }) => [
        tree.getSearchValue(),
        tree.getItems(),
        tree.getConfig().isSearchMatchingItem,
      ],
      (search, items, isSearchMatchingItem) =>
        items.filter((item) => search && isSearchMatchingItem?.(search, item)),
    ),
  },

  itemInstance: {
    isMatchingSearch: ({ tree, item }) =>
      tree.getSearchMatchingItems().some((i) => i.getId() === item.getId()),
  },

  hotkeys: {
    openSearch: {
      hotkey: "LetterOrNumber",
      preventDefault: true, // TODO make true default
      isEnabled: (tree) => !tree.isSearchOpen(),
      handler: (e, tree) => {
        e.stopPropagation();
        tree.expandAll?.();
        tree.openSearch(e.key);
      },
    },

    closeSearch: {
      // TODO allow multiple, i.e. Enter
      hotkey: "Escape",
      allowWhenInputFocused: true,
      isEnabled: (tree) => tree.isSearchOpen(),
      handler: (_e, tree) => {
        tree.closeSearch();
        tree.updateDomFocus();
      },
    },

    submitSearch: {
      hotkey: "Enter",
      allowWhenInputFocused: true,
      isEnabled: (tree) => tree.isSearchOpen(),
      handler: (e, tree) => {
        const focusedItem = tree.getFocusedItem();
        e.stopPropagation();
        tree.closeSearch();
        if (focusedItem){
          focusedItem.setFocused();
          tree.updateDomFocus();
          tree.setSelectedItems([focusedItem.getId()]);
        }
      },
    },

    nextSearchItem: {
      hotkey: "ArrowDown",
      allowWhenInputFocused: true,
      canRepeat: true,
      isEnabled: (tree) => tree.isSearchOpen(),
      handler: (_e, tree) => {
        const focusItem = tree
          .getSearchMatchingItems()
          .find(
            (item) =>
              item.getItemMeta().index >
              tree.getFocusedItem().getItemMeta().index,
          );
        focusItem?.setFocused();
        focusItem?.scrollTo({ block: "nearest", inline: "nearest" });
      },
    },

    previousSearchItem: {
      hotkey: "ArrowUp",
      allowWhenInputFocused: true,
      canRepeat: true,
      isEnabled: (tree) => tree.isSearchOpen(),
      handler: (_e, tree) => {
        const focusItem = [...tree.getSearchMatchingItems()]
          .reverse()
          .find(
            (item) =>
              item.getItemMeta().index <
              tree.getFocusedItem().getItemMeta().index,
          );
        focusItem?.setFocused();
        focusItem?.scrollTo({ block: "nearest", inline: "nearest" });
      },
    },
  },
};
