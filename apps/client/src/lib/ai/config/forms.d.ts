declare const forms: {
  create_topic: {
    type: "create_topic";
    title: string;
    description: string;
    fields: Array<{
      name: string;
      label: string;
      type: "text" | "select" | "multiselect";
      required: boolean;
      options?: Array<{ label: string; value: string; }>;
    }>;
    submitLabel: string;
    cancelLabel: string;
  };
  create_step: {
    type: "create_step";
    title: string;
    description: string;
    fields: Array<{
      name: string;
      label: string;
      type: "text" | "select" | "multiselect";
      required: boolean;
      options?: Array<{ label: string; value: string; }>;
    }>;
    submitLabel: string;
    cancelLabel: string;
  };
  create_task: {
    type: "create_task";
    title: string;
    description: string;
    fields: Array<{
      name: string;
      label: string;
      type: "text" | "select" | "multiselect";
      required: boolean;
      options?: Array<{ label: string; value: string; }>;
    }>;
    submitLabel: string;
    cancelLabel: string;
  };
  use_template_steps: {
    type: "use_template_steps";
    title: string;
    description: string;
    fields: Array<{
      name: string;
      label: string;
      type: "text" | "select" | "multiselect";
      required: boolean;
      options?: Array<{ label: string; value: string; }>;
    }>;
    submitLabel: string;
    cancelLabel: string;
  };
  complete_topic: {
    type: "complete_topic";
    title: string;
    description: string;
    fields: Array<{
      name: string;
      label: string;
      type: "text" | "select" | "multiselect";
      required: boolean;
      options?: Array<{ label: string; value: string; }>;
    }>;
    submitLabel: string;
    cancelLabel: string;
  };
  mark_as_bookmark: {
    type: "mark_as_bookmark";
    title: string;
    description: string;
    fields: Array<{
      name: string;
      label: string;
      type: "text" | "select" | "multiselect";
      required: boolean;
      options?: Array<{ label: string; value: string; }>;
    }>;
    submitLabel: string;
    cancelLabel: string;
  };
};

export default forms; 