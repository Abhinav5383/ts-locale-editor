export type NodeBase = { key: string };

// Strings
type StringLiteralNode = {
    type: NodeType.String;
    value: string;
};
type StringTemplateLiteralNode = {
    type: NodeType.StringTemplate;
    value: string;
};
export type StringNode = StringLiteralNode | StringTemplateLiteralNode;

// Variables
export type VariableNode = {
    type: NodeType.Variable;
    name: string;
};

// Arrays
export type ArrayNode = {
    type: NodeType.Array;
    value: (StringNode | VariableNode)[];
};

// Functions
export type TranslationFn_Params = {
    name: string;
    type: string;
};
export type TranslationFn_BlockExprBody = {
    type: NodeType.BlockExpression; // can't determine return types of block functions yet, so just default to unknown :))
    value: string; // raw code string of the function body
};
export type TranslationFn_Body =
    | StringNode
    | VariableNode
    | ArrayNode
    | TranslationFn_BlockExprBody; // raw code string of the function body

export type FunctionNode<T extends TranslationFn_Body = TranslationFn_Body> = {
    type: NodeType.Function;
    params: TranslationFn_Params[];
    body: T;
};

// Objects
export type ObjectNode = {
    type: NodeType.Object;
    value: WithKey<TranslationNode>[];
};

export type WithKey<T extends TranslationNodeUnion> = NodeBase & T;

export type TranslationNodeUnion =
    | StringNode
    | VariableNode
    | ArrayNode
    | ObjectNode
    | FunctionNode;

// Union type for all translation nodes
export type TranslationNode = TranslationNodeUnion;

// ========== Other things ===========

export enum ExportType {
    Named = "named",
    Default = "default",
}

export enum NodeType {
    String = "string",
    StringTemplate = "string_template",
    Variable = "variable",
    Array = "array",
    Object = "object",
    Function = "function",
    BlockExpression = "BlockExpression",
}
