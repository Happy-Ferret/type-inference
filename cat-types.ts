import { Myna as m } from "./node_modules/myna-parser/myna";
import { Type, quotation, typeConstant, TypeArray, idFunction, composeFunctionChain, composeFunctionChainReverse } from "./type-system";
import { parseType, typeParser } from './type-parser';
import { catParser } from "./cat-parser";
import { catStdOps } from "./cat-library";

export var verbose: boolean = true;

// The types of the core Cat 
export const catTypes = {
    apply   : "((('a -> 'b) 'a) -> 'b)",
    call    : "(((('a 's) -> ('b 's)) ('a 's)) -> ('b 's))",
    compose : "((('b -> 'c) (('a -> 'b) 'd)) -> (('a -> 'c) 'd))",
    quote   : "(('a 'b) -> (('c -> ('a 'c)) 'b))",
    dup     : "(('a 'b) -> ('a ('a 'b)))",
    swap    : "(('a ('b 'c)) -> ('b ('a 'c)))",
    pop     : "(('a 'b) -> 'b)",
    id      : "('a -> 'a)",
};

// Converted into type expressions (so we don't reparse each time)
export type TypeLookup = { [op: string] : Type };
export const catTypesParsed : TypeLookup = { }

// Parse the types
for (let k in catTypes) {
    const t = parseType(catTypes[k]);
    if (verbose)
        console.log(k + " : " + t);
    catTypesParsed[k] = t; 
}

// Compute the standard op types
for (let op in catStdOps) {
    const def = catStdOps[op];
    const t = inferCatType(def);
    if (verbose)
        console.log(op + " = " + def + " : " + t);
    catTypesParsed[op] = t; 
}     

function catTypeFromAst(ast: m.AstNode) : TypeArray {
    switch (ast.name) {
        case "integer": 
            return quotation(typeConstant('Num'));
        case "true": 
        case "false": 
            return quotation(typeConstant('Bool'));
        case "identifier": {
            if (!(ast.allText in catTypesParsed)) 
                throw new Error("Could not find type for term: " + ast.allText);
            return catTypesParsed[ast.allText] as TypeArray;
        }
        case "quotation": {
            var innerType = ast.children.length > 0
                ? catTypeFromAst(ast.children[0])
                : idFunction()
            return quotation(innerType);
        }
        case "terms": {
            var types = ast.children.map(catTypeFromAst);
            return composeFunctionChainReverse(types);
        }
        default:
            throw new Error("Could not figure out function type");
    }
}

export function inferCatType(s:string) : TypeArray {
    var ast = catParser(s);
    if (ast.allText.length != s.length)
        throw new Error("Could not parse the entire term: " + s);
    return catTypeFromAst(ast);
}