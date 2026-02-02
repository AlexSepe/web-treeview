import { useEffect, useState } from "react";
import { ListExpressionValue, ObjectItem } from "mendix";

type CaptionState = {
  value?: string;
  loading: boolean;
};

function useCaption(item: ObjectItem, captionText: ListExpressionValue<string>, intervalMs: number = 300): CaptionState {
  const [state, setState] = useState<CaptionState>({
    value: captionText.get(item).value,
    loading: captionText.get(item).status === "loading"
  });

  useEffect(() => {
    let mounted = true;

    const check = () => {
      const entry = captionText.get(item);
      if (mounted) {
        setState({
          value: entry.value?.toString(),
          loading: entry.status === "loading"
        });
      }
    };

    // primeira checagem imediata
    check();

    // polling enquanto estiver em loading
    const id = setInterval(() => {
      const entry = captionText.get(item);
      if (entry.status !== "loading") {
        check();
        clearInterval(id);
      } else {
        check();
      }
    }, intervalMs);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [item, captionText, intervalMs]);

  return state;
}

export { useCaption };