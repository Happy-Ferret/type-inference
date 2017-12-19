// A Type Inference Algorithm by Christopher Digginss  
// This a novel type inference algorithm that provides support for full inference of higher rank polymorphic types

// Copyright 2017 by Christopher Diggins 
// Licensed under the MIT License

// The one and only module
export module TypeInference 
{
    // Turn on for debugging purposes
    export var trace = false;

    // Base class of a type: either a TypeArray, TypeVariable, or TypeConstant
    export class Type { 
        // All type varible referenced somewhere by the type, or the type itself if it is a TypeVariable.
        typeVars : TypeVariable[] = [];            
    }

    // A collection of a fixed number of types can be used to represent function types or tuple types. 
    // A list of types is usually encoded as a nested set of type pairs (TypeArrays with two elements).
    // If a TypeArray declares variables with an implicit for-all qualifier, it is considered a "PolyType". 
    // The variables which are part of the TypeArray 
    // All variables are assumed to be uniquely named. When constructed the TypeArray 
    // will compute which type variables need to be lifted to it's "TypeScheme".
    export class TypeArray extends Type
    {
        constructor(
            public types : Type[])
        { 
            super(); 

            // Compute all referenced types 
            for (var t of types) 
                this.typeVars = this.typeVars.concat(t.typeVars);            
            
            // Assign all correct type variables to this type scheme
            for (var i=0; i < types.length; ++i) {
                var child = types[i];

                // Individual type variables are part of this scheme 
                if (child instanceof TypeVariable) 
                    _reassignAllVarsToScheme(child.name, this);
                else 
                if (child instanceof TypeArray) {
                    // Get the vars of the child type. 
                    // If any of them show up in multiple child arrays, then they 
                    // are part of the parent's child 
                    for (var childVar of child.typeVars)
                        if (_isTypeVarUsedElsewhere(this, childVar.name, i))
                            _reassignAllVarsToScheme(childVar.name, this);                
                }
            }

            // Implementation validation step:
            // Assure that the type scheme variables are all in the typeVars 
            for (var v of this.typeVarDeclarations) {
                var i = this.typeVars.indexOf(v);
                if (i < 0) 
                    throw new Error("Internal error: type scheme references a variable that is not marked as referenced by the type variable")
            }
        }

        // The type variables that are bound to this TypeArray. 
        // Always a subset of typeVars
        typeVarDeclarations : TypeVariable[] = [];

        // Provides a user friendly representation of the type scheme 
        typeSchemeToString() {
            var tmp = {};
            for (var v of this.typeVarDeclarations)
                tmp[v.name] = true;
            var r = Object.keys(tmp);
            if (r.length == 0)
                return "";
            return "!" + r.join("!") + ".";            
        }

        toString() : string { 
            return this.typeSchemeToString() + "(" + this.types.join(' ') + ")"; 
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
            this.typeVars.push(this);
        }
        
        scheme : TypeArray;

        toString() : string { 
            return this.name;
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
            public name:string,
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

    // This is helper function helps determine whether a type variable should belong 
    export function _isTypeVarUsedElsewhere(t:TypeArray, varName:string, pos:number) : boolean {
        for (var i=0; i < t.types.length; ++i) 
            if (i != pos && t.types[i].typeVars.some(v => v.name == varName))
                return true;
        return false;
    }

    // Associate the variable with a new type scheme. Removing it from the previous varScheme 
    export function _reassignVarScheme(v:TypeVariable, t:TypeArray) {
        // Remove the variable from the previous scheme 
        if (v.scheme != undefined) 
            v.scheme.typeVarDeclarations = v.scheme.typeVarDeclarations.filter(t => t.name != v.name);
        // Set the new scheme 
        v.scheme = t;
        t.typeVarDeclarations.push(v);
    }
        
    // Associate all variables of the given name in the TypeArray with the TypeArray's scheme
    export function _reassignAllVarsToScheme(varName:string, t:TypeArray) {
        t.typeVars.filter(v => v.name == varName).forEach(v => _reassignVarScheme(v, t));
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
                        return recursiveType(i);
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

        // All unifiers that refer to varName as the unifier are pointed to the new unifier 
        _updateVariableUnifiers(varName:string, u:TypeUnifier) {
            for (var x in this.unifiers) {
                var t = this.unifiers[x].unifier;
                if (t instanceof TypeVariable) 
                    if (t.name == varName)
                        this.unifiers[x] = u;
            }
        }            
            
        // Computes the best unifier between the current unifier and the new variable.        
        // Updates all unifiers which point to a (or to t if t is a TypeVar) to use the new type. 
        _updateUnifier(a:TypeVariable, t:Type, depth:number) : Type {            
            var u = this._getOrCreateUnifier(a);            
            u.unifier = this._chooseBestUnifier(u.unifier, t, depth);
            this._updateVariableUnifiers(a.name, u);
            if (t instanceof TypeVariable) {
                // Make sure a unifier is created
                this._getOrCreateUnifier(t);
                this._updateVariableUnifiers(t.name, u);
            }
            return u.unifier;
        }

        // Gets or creates a type unifiers for a type variables
        _getOrCreateUnifier(t : TypeVariable) : TypeUnifier {
            if (!(t.name in this.unifiers))
                return this.unifiers[t.name] = new TypeUnifier(t.name, t);
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
        return typeArray([input, typeConstant('->'), output]);    
    }    

    // Creates an array type, as a special kind of TypeArray
    export function arrayType(element:Type) : TypeArray {
        return typeArray([element, typeConstant('[]')]);    
    }

    // Creates a list type, as a special kind of TypeArray
    export function listType(element:Type) : TypeArray {
        return typeArray([element, typeConstant('*')]);    
    }

    // Creates a recursive type, as a special kind of TypeArray. The numberical value 
    // refers to the depth of the recursion: how many TypeArrays you have to go up 
    // to find the recurison base case. 
    export function recursiveType(depth:Number) : TypeArray {
        return typeArray([typeConstant('rec'), typeConstant(depth.toString())]);    
    }
    
    // Returns true if and only if the type is a type constant with the specified name
    export function isTypeConstant(t:Type, name:string) : boolean {
        return t instanceof TypeConstant && t.name === name;
    }

    // Returns true if and only if the type is a type constant with the specified name
    export function isTypeArray(t:Type, name:string) : boolean {
        return t instanceof TypeArray && t.types.length == 2 && isTypeConstant(t.types[1], '[]');
    }

    // Returns true iff the type is a TypeArary representing a function type
    export function isFunctionType(t:Type) : boolean {        
        return t instanceof TypeArray && t.types.length == 3 && isTypeConstant(t.types[1], '->');
    }

    // Returns the input types (argument types) of a TypeArray representing a function type
    export function functionInput(t:Type) : Type {        
        if (!isFunctionType(t)) throw new Error("Expected a function type");
        return (t as TypeArray).types[0];
    }

    // Returns the output types (return types) of a TypeArray representing a function type
    export function functionOutput(t:Type) : Type {        
        if (!isFunctionType(t)) throw new Error("Expected a function type");
        return (t as TypeArray).types[2];
    }

    // Returns all types contained in this type
    export function descendantTypes(t:Type, r:Type[] = []) : Type[] {
        r.push(t);
        if (t instanceof TypeArray) 
            t.types.forEach(t2 => descendantTypes(t2, r));
        return r;
    }

    // Returns true if the type is a polytype
    export function isPolyType(t:Type) {
        return t instanceof TypeArray && t.typeVarDeclarations.length > 0;
    }

    // Returns true if the type is a function that generates a polytype.
    export function generatesPolytypes(t:Type) : boolean {
        if (!isFunctionType(t)) 
            return false;
        return descendantTypes(functionOutput(t)).some(isPolyType);
    }

    // Returns the type of the id function 
    export function idFunction() : TypeArray {
        var s = typeVar('_');
        return functionType(s, s);
    }

    // When unifying I will need to use this function.
    export function clone(t:Type) : Type {
        if (t instanceof TypeVariable)
            return typeVar(t.name);
        else if (t instanceof TypeConstant)
            return typeConstant(t.name);
        else if (t instanceof TypeArray)
            return typeArray(t.types.map(clone));
    }

    //========================================================
    // Variable name functions

    // Renames all variables with the new
    export function renameVars(t:Type, names:any) : Type {
        var r = clone(t);
        for (var v of descendantTypes(r))
            if (v instanceof TypeVariable) 
                v.name = names[v.name];
        return r;
    }
    
    // Generates fresh variable names for all the variables in the list
    export function generateFreshNames(t:Type, id:number) {
        var names = {};
        for (var v of descendantTypes(t))
            if (v instanceof TypeVariable) 
                names[v.name] = v.name + "$" + id;
        return renameVars(t, names);
    }

    // Rename all type variables os that they follow T0..TN according to the order the show in the tree. 
    export function normalizeVarNames(t:Type) : Type {
        var names = {};
        var count = 0;
        for (var dt of descendantTypes(t)) 
            if (dt instanceof TypeVariable) 
                if (!(dt.name in names))
                    names[dt.name] = "t" + count++;                
        return renameVars(t, names);
    }

    // Compares whether two types are the same after normalizing the type variables. 
    export function areTypesSame(t1:Type, t2:Type) {
        var s1 = normalizeVarNames(t1).toString();
        var s2 = normalizeVarNames(t2).toString();
        return s1 === s2;
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

    //============================================================
    // Top level type operations which require unification 
    // - Composition
    // - Application
    // - Quotation

    // Returns the function type that results by composing two function types
    export function composeFunctions(f:TypeArray, g:TypeArray) : TypeArray {
        if (!isFunctionType(f)) throw new Error("Expected a function type for f");
        if (!isFunctionType(g)) throw new Error("Expected a function type for g");
        
        f = generateFreshNames(f, 0) as TypeArray;
        g = generateFreshNames(g, 1) as TypeArray;

        if (trace) {
            console.log("f: " + f);
            console.log("g: " + g);
        }

        var inF = functionInput(f);
        var outF = functionOutput(f);
        var inG = functionInput(g);
        var outG = functionOutput(g);

        var e = new Unifier();
        e.unifyTypes(outF, inG);
        var input = e.getUnifiedType(inF);
        var output = e.getUnifiedType(outG);

        var r = functionType(input, output);
        if (trace) {
            console.log(e.state());
        }
        return r;        
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
        fxn = clone(fxn) as TypeArray;
        args = clone(args) as TypeArray;
        var input = functionInput(fxn);
        var output = functionOutput(fxn);    
        u.unifyTypes(input, args);
        return u.getUnifiedType(output) as TypeArray;
    }

    // Creates a function type that generates the given type 
    export function quotation(x:Type) : TypeArray {
        var row = typeVar('_');
        return functionType(row, typeArray([x, row]));
    }
}