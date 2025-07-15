# Store Refactor Guideline

This refactor splits the original `topicStore` into three dedicated stores.

## Changes Overview
- **Backup**: The pre-refactor implementation is kept at `stores/topicStore.backup.beforeRefactor.ts`.
- **New Files**:
  - `apps/client/src/store/topicStore.full.ts` – full original implementation used internally by other stores.
  - `apps/client/src/store/topicStore.ts` – exposes only Topic related methods.
  - `apps/client/src/store/taskStore.ts` – wrapper exposing Task related methods.
  - `apps/client/src/store/goalStore.ts` – wrapper exposing Goal related methods.

## Usage
- Import `useTopicStore` for Topic CRUD and collaboration features.
- Import `useTaskStore` for Task related operations.
- Import `useGoalStore` for Goal related operations.

Update existing imports accordingly.

## Legacy File
- The original pre-refactor code is available at `stores/topicStore.backup.beforeRefactor.ts` for reference.
