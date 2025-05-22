import { BaseMemory, InputValues, MemoryVariables } from "langchain/memory";
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';

export class CustomSummaryMemory extends BaseMemory {
  private messages: BaseMessage[] = [];
  private maxMessages: number = 10;

  constructor() {
    super();
  }

  get memoryKeys(): string[] {
    return ["history"];
  }

  async loadMemoryVariables(_values: InputValues): Promise<MemoryVariables> {
    return {
      history: this.messages || []
    };
  }

  async saveContext(input: InputValues, output: MemoryVariables): Promise<void> {
    const inputText = input.input ?? "";
    const outputText = output.output ?? "";

    // 更新消息歷史
    this.messages.push(
      new HumanMessage(inputText),
      new AIMessage(outputText)
    );

    // 保持最近 N 輪對話
    if (this.messages.length > this.maxMessages * 2) {
      this.messages = this.messages.slice(-this.maxMessages * 2);
    }
  }

  clear(): void {
    this.messages = [];
  }
} 