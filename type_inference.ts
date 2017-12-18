// A Type Inference Algorithm by Christopher Digginss  
// This a novel type inference algorithm not Hindley Milner Type inference aka Algorithm W. 
// It provides support for higher rank polymorphism and row polymorphism.

// Copyright 2017 by Christopher Diggins 
// Licensed under the MIT License

// The one and only super module
export module TypeInference 
{
    // Turn on for debugging purposes
    export var trace = false;

    // Base class of a type: either a TypeArray, TypeVariable, or TypeConstant
    export class Type { 
        get descendantTypes() : Type[] {
            return [];
        }            
    }

    // A list of types can be used to represent function types or tuple types. 
    // This is called a PolyType since it may contain variables with an implicit for-all qualifier.    
    export class TypeArray extends Type
    {
        constructor(
            public types : Type[])
        { 
            super(); 
        }

        // Get the type variables belonging to this TypeArray 
        get typeScheme() : TypeVariable[] {
            return getVars(this).filter(v => v.scheme == this);
        }

        // Get all descendant types 
        get descendantTypes() : Type[] {
            var r = this.types.slice();
            for (var t of this.types) {
                r = r.concat(t.descendantTypes);
            }
            return r;
        }

        toString() : string { 
            var ts = this.typeScheme.join("!");
            if (ts.length > 0)
                ts = "!" + ts + ".";
            return ts + "(" + this.types.join(' ') + ")"; 
        }
    }

    // A type variable is used for generics (e.g. T0, TR). 
    // The type variable must belong to a type scheme of a polytype. This is like a "scope" for type variables.
    // Computing the type schema is done in an external function.
    export class TypeVariable extends Type
    {
        constructor(
            public name : string) 
        {   
            super(); 
        }
        
        // The type array which contains the definition for this type variable
        scheme : TypeArray = null;

        toString() : string { 
            return "'" + this.name;
        }
    }

    // A type constant is a fixed type (e.g. int, function). Also called a MonoType.
    export class TypeConstant extends Type
    {
        constructor(
            public name : string)
        { super(); }

        toString() : string { 
            return this.name;
        }
    }

    // A type unifier is a mapping from a type variable to a best-fit type
    export class TypeUnifier
    {
        constructor(
            public name:TypeVariable,
            public unifier:Type)
        { }
    }

    // Given a type variable name finds the type set
    export interface ITypeUnifierLookup {
        [typeVarName:string] : TypeUnifier;
    }

    // Associates variable names with type expressions 
    export interface ITypeLookup {
        [varName:string] : Type;
    }

    // Compares whether two types are the same after normalizing the type variables. 
    export function areTypesSame(t1:Type, t2:Type) {
        // TODO: implement normalize
        var s1 = t1.toString();
        var s2 = t2.toString();
        return s1 === s2;
    }

    // Returns all type variables contained in a given type
    export function getVars(t : Type, r : TypeVariable[] = []) : TypeVariable[] {        
        if (t instanceof TypeVariable)
            r.push(t);
        else if (t instanceof TypeArray) 
            for (var t2 of t.types)
                getVars(t2, r);        
        return r;
    }

    // This is helper function helps determine whether a type variable should belong 
    export function isTypeVarUsedElsewhere(t:TypeArray, varName:string, pos:number) : boolean {
        for (var i=0; i < t.types.length; ++i) {
            if (i != pos) {
                var tmp = getVars(t.types[0]);
                if (varName in tmp) 
                    return true;
            }
        }
        return false;
    }

    // Assigns each type variable to a scheme based on it appearing in a type array, 
    // and no other enclosing type array. This is a naive algorithm.
    export function computeSchemes(t:Type) {
        if (t instanceof TypeArray) {            
            // Recursively compute schemas
            for (var t2 of t.types)
                computeSchemes(t2);
            
            for (var v of getVars(t))
                if (v.scheme == null)
                    v.scheme = t;

            for (var i=0; i < t.types.length-1; ++i) {
                var vars = getVars(t.types[i]);
                for (var v of vars) {
                    if (isTypeVarUsedElsewhere(t, v.name, i))
                        v.scheme = t;
                }
            }
        }
    }

    // Use this class to unify types that are constrained together.
    export class Unifier
    {
        // Given a type variable name find the unifier. Multiple type varialbles will map to the same unifier 
        unifiers : ITypeUnifierLookup = {};

        // Unify both types, returning the most specific type possible. 
        // When a type variable is unified with something the new unifier is stored. 
        // Note: TypeFunctions and TypePairs ar handled as TypeLists
        // * Constants are preferred over lists and variables
        // * Lists are preferred over variables
        // * Given two variables, the first one is chosen. 
        unifyTypes(t1:Type, t2:Type, depth:number=0) : Type {
            if (trace)
                console.log(`Unification depth ${depth} of ${t1} and ${t2}`);
            if (!t1 || !t2) 
                throw new Error("Missing type expression");
            if (t1 == t2)
                return t1;                 
            // Variables are least preferred.  
            if (t1 instanceof TypeVariable) 
            {
                // Two variable have a special path: 
                if (t2 instanceof TypeVariable) 
                    return this._unifyTypeVars(t1, t2, depth);
                else
                    return this._updateUnifier(t1, t2, depth);
            }
            // If one is a variable its unifier with the new type. 
            else if (t2 instanceof TypeVariable) 
            {
                return this._updateUnifier(t2, t1, depth);
            }
            // Constants are best preferred 
            else if (t1 instanceof TypeConstant && t2 instanceof TypeConstant)
            {
                if (t1.name != t2.name)
                    throw new Error("Can't unify: " + t1.name + " and " + t2.name);
                else 
                    return t1;
            }
            // We know by the time we got here, if only one type is a TypeConstant the other is not a variable or a constant
            else if (t1 instanceof TypeConstant || t2 instanceof TypeConstant)
            {
                throw new Error("Can't unify: " + t1 + " and " + t2);
            }
            // Check for type list unification. We know that both should be type lists since other possibilities are exhausted. 
            else if (t1 instanceof TypeArray && t2 instanceof TypeArray)
            {                
                return this._unifyLists(t1, t2, depth+1);
            }
            throw new Error("Internal error, unexpected code path: " + t1 + " and " + t2);
        }
            
        // Debug function that dumps prints out a representation of the engine state. 
        state() : string {
            var results = [];
            for (var k in this.unifiers) {
                var u = this.unifiers[k];
                var t = this.getUnifiedType(u.unifier);
                results.push(`type unifier for ${ k }, unifier name ${ u.name }, unifying type ${t}`);
            }
            return results.join('\n');
        }             

        // Replaces all variables in a type expression with the unified version
        // The previousVars variable allows detection of cyclical references
        getUnifiedType(expr:Type, previousVars:string[] = []) : Type {
            if (expr instanceof TypeConstant)
                return expr;
            else if (expr instanceof TypeVariable) {
                // If we encountered the type variable previously, it meant that there is a recursive relation
                for (var i=0; i < previousVars.length; ++i) 
                    if (previousVars[i] == expr.name) 
                        throw new Error("Recursive relation found for " + expr + " at distance " + i);
                var u = this.unifiers[expr.name];
                if (!u)
                    return expr;
                // If the unifier is a type variable, we are done. 
                else if (u.unifier instanceof TypeVariable)
                    return u.unifier;
                else if (u.unifier instanceof TypeConstant)
                    return u.unifier;
                else if (u.unifier instanceof TypeArray)
                    return this.getUnifiedType(u.unifier, [expr.name].concat(previousVars));
                else 
                    throw new Error("Unhandled kind of type " + expr);
            }
            else if (expr instanceof TypeArray) 
                return new TypeArray(expr.types.map((t) => this.getUnifiedType(t, previousVars)));
            else
                throw new Error("Unrecognized kind of type expression " + expr);
        }

        // Choose one of two unifiers, or continue the unification process if necessary
        _chooseBestUnifier(t1:Type, t2:Type, depth:number) : Type {
            var r:Type;
            if (t1 instanceof TypeVariable && t2 instanceof TypeVariable)
                r = t1;
            else if (t1 instanceof TypeVariable)
                r = t2;
            else if (t2 instanceof TypeVariable)
                r = t1;
            else 
                r = this.unifyTypes(t1, t2, depth+1);
            if (trace)
                console.log(`Chose type for unification ${r} between ${t1} and ${t2} at depth ${depth}`)
            return r;
        }

        // Unifying lists involves unifying each element
        _unifyLists(list1:TypeArray, list2:TypeArray, depth:number) : TypeArray {
            if (list1.types.length != list2.types.length) 
                throw new Error("Cannot unify differently sized lists: " + list1 + " and " + list2);
            var rtypes : Type[] = [];
            for (var i=0; i < list1.types.length; ++i)
                rtypes.push(this.unifyTypes(list1.types[i], list2.types[i], depth));
            return new TypeArray(rtypes);
        }

        // Computes the best unifier between the current unifier and the new variable.        
        // Stores the result in the unifier name.
        _updateUnifier(a:TypeVariable, t:Type, depth:number) : Type {
            var u = this._getOrCreateUnifier(a);
            u.unifier = this._chooseBestUnifier(u.unifier, t, depth);
            if (u.unifier instanceof TypeVariable)
                this.unifiers[u.unifier.name] = u;
            if (t instanceof TypeVariable)                
                this.unifiers[t.name] = u;
            return u.unifier;
        }

        // Unifying two variables. Both share the same unifier afterwards.
        _unifyTypeVars(a:TypeVariable, b:TypeVariable, depth:number) : Type {
            var t = this._getOrCreateUnifier(b).unifier;
            var r = this._updateUnifier(a, t, depth);
            this.unifiers[b.name] = this._getOrCreateUnifier(a);
            return r;
        }

        // Gets or creates a type unifiers for a type variables
        _getOrCreateUnifier(t : TypeVariable) : TypeUnifier {
            if (!(t.name in this.unifiers))
                return this.unifiers[t.name] = new TypeUnifier(t, t);
            else 
                return this.unifiers[t.name];
        }
    }

    //======================================================================================
    // Helper functions 

    // Creates a type list as nested pairs ("cons" cells ala lisp)
    export function typeConsList(types:Type[]) : TypeArray {        
        if (types.length < 3)
            return typeArray(types);
        else 
            return typeArray([types[0], typeConsList(types.slice(1))]);
    }

    // Creates a type array from an array of types
    export function typeArray(types:Type[]) : TypeArray {        
        return new TypeArray(types);
    }

    // Creates a type constant 
    export function typeConstant(name:string) : TypeConstant {
        return new TypeConstant(name);
    }

    // Creates a type variable
    export function typeVar(name:string) : TypeVariable {
        return new TypeVariable(name);
    }

    // Creates a function type, as a special kind of a TypeArray 
    export function functionType(input:Type, output:Type) : TypeArray {
        return typeArray([typeConstant('function'), input, output]);    
    }    

    // Creates an array type, as a special kind of TypeArray
    export function arrayType(element:Type) : TypeArray {
        return typeArray([typeConstant('array'), element]);    
    }

    // Returns true if and only if the type is a type constant with the specified name
    export function isTypeConstant(t:Type, name:string) : boolean {
        return t instanceof TypeConstant && t.name === name;
    }

    // Returns true if the type is a TypeArary representing a function type
    export function isFunctionType(t:Type) : boolean {        
        return t instanceof TypeArray && t.types.length == 3 && isTypeConstant(t.types[0], 'function');
    }

    // Returns the input types (argument types) of a TypeArray representing a function type
    export function functionInput(t:Type) : Type {        
        if (!isFunctionType(t)) throw new Error("Expected a function type");
        return (t as TypeArray).types[1];
    }

    // Returns the output types (return types) of a TypeArray representing a function type
    export function functionOutput(t:Type) : Type {        
        if (!isFunctionType(t)) throw new Error("Expected a function type");
        return (t as TypeArray).types[2];
    }

    // Returns the function type that results by composing two function types
    export function composeFunctions(f:TypeArray, g:TypeArray) : TypeArray {
        if (!isFunctionType(f)) throw new Error("Expected a function type for f");
        if (!isFunctionType(g)) throw new Error("Expected a function type for g");
        
        var inF = functionInput(f);
        var outF = functionInput(f);
        var inG = functionInput(g);
        var outG = functionOutput(g);

        var e = new Unifier();
        e.unifyTypes(outF, inG);
        var input = e.getUnifiedType(inF);
        var output = e.getUnifiedType(outG);

        return new TypeArray([typeConstant('function'), input, output]);    
    }

    // Returns the type of the id function 
    export function idFunction() : TypeArray {
        var s = typeVar('_');
        return functionType(s, s);
    }

    // Composes a chain of functions
    export function composeFunctionChain(fxns:TypeArray[]) : TypeArray {
        if (fxns.length == 0)
            return idFunction();        
        var t = fxns[0];
        for (var i=0; i < fxns.length; ++i) 
            t = composeFunctions(t, fxns[i]);
        return t;
    }

    // Applies a function to input arguments and returns the result 
    export function applyFunction(fxn:TypeArray, args:TypeArray) : TypeArray {
        var u = new Unifier();
        var input = functionInput(fxn);
        var output = functionOutput(fxn);
        u.unifyTypes(input, args);
        return u.getUnifiedType(output) as TypeArray;
    }

    //==========================================================================================
    // Type Environments 
    // 
    // This is the top-level implementation of a type inference algorithm that would be used in 
    // a programming language. 

    // Used to track equivalencies between types 
    class TypeConstraint 
    {
        constructor(
            public a:Type,
            public b:Type,
            public location:any)
        { }
    }

    // An example implementation of a type environment. Used to implement a type inference algorithm
    // in a typical language with variable tracking and scopes.
    export class TypeEnv
    {
        unifier : Unifier = new Unifier();
        scopes : ITypeLookup[] = [{}]
        history : ITypeLookup[] = [{}];
        constraints : TypeConstraint[];
        index : number = 0;

        pushScope() {
            var scope = {};
            this.history.push(scope);
            this.scopes.push(scope);
        }

        popScope() {
            this.scopes.pop();
        }

        currentScope() : ITypeLookup {
            return this.scopes[this.scopes.length-1];
        }
        
        getName(name:string) : Type { 
            for (var scope of this.scopes)
                if (name in scope)
                    return scope[name];
            throw new Error("Could not find name: " + name);
        }
        
        addName(name:string) { 
            var scope = this.currentScope();
            if (name in scope) throw new Error("Name already defined in current scope: " + name);
            return scope[name] = null;
        }

        findNameScope(name:string) : ITypeLookup {
            for (var i=this.scopes.length-1; i >= 0; ++i) {
                var scope = this.scopes[i];
                if (name in scope)
                    return scope;
            }
            throw new Error("Could not find name in any of the scopes: "+ name)
        }

        addConstraint(a:Type, b:Type, location:any) {
            this.constraints.push(new TypeConstraint(a, b, location));
        }

        addAssignment(name:string, type:Type, location:any = null) : Type { 
            var scope = this.findNameScope(name);        
            if (scope[name] == null)
                scope[name] = type;
            else
                this.addConstraint(scope[name], type, location);
            return type;
        }
        
        addFunctionCall(name:string, args:TypeArray, location:any = null) : Type { 
            var funcType = this.findNameScope(name)[name] as TypeArray;
            if (!isFunctionType(funcType)) throw new Error("Not a function type associated with " + name);
            var input = functionInput(funcType);    
            var output = functionOutput(funcType);
            this.addConstraint(input, output, location);
            return output;
        }
    }
}