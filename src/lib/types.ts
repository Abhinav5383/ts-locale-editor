export type NodeBase = { key: string };

// Strings
type StringLiteralNode = {
    type: "string";
    value: string;
};
type StringTemplateLiteralNode = {
    type: "string_template";
    value: string;
};
export type StringNode = StringLiteralNode | StringTemplateLiteralNode;

// Variables
export type VariableNode = {
    type: "variable";
    name: string;
};

// Arrays
export type ArrayNode = {
    type: "array";
    value: (StringNode | VariableNode)[];
};

// Functions
export type TranslationFn_Params = {
    name: string;
    type: string;
};
export type TranslationFn_BlockExprBody = {
    type: "BlockExpression"; // can't determine return types of block functions yet, so just default to unknown :))
    value: string; // raw code string of the function body
};
export type TranslationFn_Body =
    | StringNode
    | VariableNode
    | ArrayNode
    | TranslationFn_BlockExprBody; // raw code string of the function body

export type FunctionNode<T extends TranslationFn_Body = TranslationFn_Body> = {
    type: "function";
    params: TranslationFn_Params[];
    body: T;
};

// Objects
export type ObjectNode = {
    type: "object";
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
