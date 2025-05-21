import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

interface ActionConfig {
  description: string;
  params: Record<string, any>;
  returns: {
    type: string;
    properties?: Record<string, any>;
    items?: {
      type: string;
      properties?: Record<string, any>;
    };
  };
}

interface ActionsConfig {
  actions: Record<string, ActionConfig>;
}

export class ActionValidator {
  private config: ActionsConfig;

  constructor() {
    const configPath = path.join(process.cwd(), 'src/lib/ai/config/actions.yaml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    this.config = yaml.load(fileContents) as ActionsConfig;
  }

  getActionConfig(action: string): ActionConfig | undefined {
    return this.config.actions[action];
  }

  validateAction(action: string, params: any): boolean {
    const actionConfig = this.config.actions[action];
    if (!actionConfig) {
      console.error(`Unknown action: ${action}`);
      return false;
    }

    // 驗證必要參數
    for (const [paramName, paramConfig] of Object.entries(actionConfig.params)) {
      if (paramConfig.required && !params[paramName]) {
        console.error(`Missing required parameter: ${paramName}`);
        return false;
      }
    }

    return true;
  }

  validateReturn(action: string, result: any): boolean {
    const actionConfig = this.config.actions[action];
    if (!actionConfig) {
      console.error(`Unknown action: ${action}`);
      return false;
    }

    const { type, properties, items } = actionConfig.returns;

    // 驗證基本類型
    if (type === 'array' && !Array.isArray(result)) {
      console.error(`Expected array return type for action: ${action}`);
      return false;
    }

    if (type === 'object' && typeof result !== 'object') {
      console.error(`Expected object return type for action: ${action}`);
      return false;
    }

    if (type === 'boolean' && typeof result !== 'boolean') {
      console.error(`Expected boolean return type for action: ${action}`);
      return false;
    }

    // 驗證物件屬性
    if (properties) {
      for (const [propName, propConfig] of Object.entries(properties)) {
        if (typeof result[propName] !== propConfig.type) {
          console.error(`Invalid property type for ${propName} in action: ${action}`);
          return false;
        }
      }
    }

    // 驗證陣列項目
    if (items) {
      for (const item of result) {
        if (items.properties) {
          for (const [propName, propConfig] of Object.entries(items.properties)) {
            if (typeof item[propName] !== propConfig.type) {
              console.error(`Invalid item property type for ${propName} in action: ${action}`);
              return false;
            }
          }
        }
      }
    }

    return true;
  }

  getActionDescription(action: string): string {
    return this.config.actions[action]?.description || '';
  }
} 