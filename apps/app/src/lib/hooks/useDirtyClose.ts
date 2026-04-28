import { useState } from "react";

/**
 * Sheet/Form 닫기 시 dirty 상태면 confirm 다이얼로그 표시.
 *
 * 사용:
 *   const dirty = name !== original.name;
 *   const close = useDirtyClose(dirty, onClose);
 *   <BottomSheet visible={visible} onClose={close.tryClose} />
 *   <ConfirmDialog visible={close.confirming}
 *     onConfirm={close.accept} onCancel={close.cancel} ... />
 */
export function useDirtyClose(isDirty: boolean, onClose: () => void) {
  const [confirming, setConfirming] = useState(false);
  return {
    tryClose() {
      if (isDirty) {
        setConfirming(true);
      } else {
        onClose();
      }
    },
    confirming,
    accept() {
      setConfirming(false);
      onClose();
    },
    cancel() {
      setConfirming(false);
    },
  };
}
