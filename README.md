# Type Inference Algorithm 

This is a simple and easy to use type inference algorithm written in TypeScript that supports polymorphic types. 

The algorithm is different than Damas-Milner type inference (aka Algorithm W) as it can infer higher-order types.

>>> I have merely tested and validated that the code works, I have not proven that it is correct. 

## Algorithm

In short the algorithm will be able to work out the polymorphic type of any function given a set of polymorphic primitive functions. 

1. Supported types are either type arrays, type constants, or type variables
1. If a new type expression is introduced: uniquely rename all of the type variables 
1. Assigning a value to a variable causes the original type and the new type to be constrained 
1. New variables are given a new type variable
1. When calling a function unify the types of the argument expressions with the 

## Extending Support for other Kinds of Types

A number of different kinds of types can be encoded as a type array. The type inference algorithm continues to work equally well. 

1. A type pair is a type array of two elements 
1. A type list is encoded as a type array of two elements:
  1. the head of the list (any type)
  1. the tail of the list (a type pair or a type variable)
1. A type array is encoded as a type array of two elements: 
  1. an "array" type constant
  1. the array element type 
1. Function types are encoded as a type array of three elements: 
  1. a "function" type consisiting 

## Higher Rank Polymorphism

This algorithm is capable of inferring polymorphic types 

For example:

('A -> 'B) = forall('A).('A -> 'A) - the id function type
('A -> 'B) = forall('A, 'B).('A -> 'B) - the most general type convering all functions.
(('A -> 'B) 'A -> 'B) = forall('A, 'B).(('A -> 'B) 'A -> 'B) - the type of the function application expresison.
(('a 'B -> 'C) 'a 'D -> ('B -> 'C) 'D) = forall('a, 'D, 'B, 'C).(('a 'B -> 'C) 'a 'D -> ('B -> 'C) 'D)

## Row Polymorphism 

Row polymorphism occurs naturally by encoding type lists as a nested type pairs, with a type variable in the last position, and by encoding function types as mapping from type lists to type lists. 

Given a function signature with no type annotations, and a series of type constraints (expressed in terms of statements or 
expressions in the target language), it will work out the most specific type signature possible, or generate a list of type errors. 

The types handled by this system are either constants (e.g. int, string, function), variables (e.g. T0, R), or 
lists (e.g. `[function, T, [T, T]]`).

The algorithm works by assigning a unique type variable to each argument and the return result. It then builds a list of constraints based on how each variable is used. When `resolve()` is called all constraints are unified to build a series of type sets associated with each type variable referenced in the system. 

"Row variables" in this case are simple existential polymorphism: they are not higher-order kinds.

## Recursive Function Types

During unification a type list might have a reference to a type list that is enclosing itself. This would generate 
a cyclical relation and indicates a recursive type. 

It is useful to detect whether the cyclical type relation indicate
is to an enclosing function. 

Because a recursive function is a type list containing N nested type-lists, identifying the recursive relation requires
substantial bookkeeping. 

 I am used in a function, here is my enclosing function type. 


References:
* Basic Polymorphic Type-Checking by Luca Cardelli (http://research.microsoft.com/users/luca/Papers/BasicTypechecking.pdf)
* http://smallshire.org.uk/sufficientlysmall/2010/04/11/a-hindley-milner-type-inference-implementation-in-python/
* HMF: Simple type inference for first-class polymorphism by Daan Leijen - http://research.microsoft.com/users/daan/download/papers/hmf-tr.pdf
* Programming Languages: Application and Interpretation by Shriram Krishnamurti ( http://cs.brown.edu/~sk/Publications/Books/ProgLangs/ ), 
* http://cs.brown.edu/courses/cs173/2012/book/types.html#%28part._.Type_.Inference%29
* http://dysphoria.net/2009/06/28/hindley-milner-type-inference-in-scala/
* http://dev.stephendiehl.com/fun/006_hindley_milner.html - Hindley-Milner Inference
* http://www.cs.uu.nl/research/techreps/repo/CS-2002/2002-031.pdf - Generalizing Hindley-Milner Type Inference Algorithms by Bastiaan Heeren
* http://fsharpcode.blogspot.ca/2010/08/hindley-milner-type-inference-sample.html -
* https://www.cl.cam.ac.uk/teaching/1415/L28/rows.pdf  
* http://www.cs.cornell.edu/courses/cs3110/2011sp/Lectures/lec26-type-inference/type-inference.htm
* https://cs.stackexchange.com/questions/53998/what-are-the-major-differences-between-row-polymorphism-and-subtyping 
* https://dl.acm.org/citation.cfm?id=581690.581699 - 
Techniques for embedding postfix languages in Haskell 

## Algorithm W (Damas-Hindley-Milner)

Based on Luca Cardelli's Implementation 

* https://brianmckenna.org/files/js-type-inference/docs/typeinference.html - JavaScript by Brian McKenna
* http://smallshire.org.uk/sufficientlysmall/2010/04/11/a-hindley-milner-type-inference-implementation-in-python/ - Python by Robert Smallshire
* http://dysphoria.net/2009/06/28/hindley-milner-type-inference-in-scala/ - Scala by Andrew 
  * http://dysphoria.net/code/hindley-milner/HindleyMilner.scala 
* http://web.archive.org/web/20050911123640/http:/www.cs.berkeley.edu/~nikitab/courses/cs263/hm.html - Nikita Borisov
* http://lucacardelli.name/Papers/BasicTypechecking.pdf - Luca Cardelli 

Other implementations

* http://catamorph.de/documents/AlgorithmW.pdf - Martin Grabmuller 2006
* http://yinyanghu.github.io/posts/2014-03-13-algorithm-w.html 
* https://github.com/maeln/LambdaHindleyMilner 

Papers

* https://homes.cs.washington.edu/~mernst/teaching/6.883/readings/p207-damas.pdf - Principal Type-Schemes for Functional Languages

## On Higher Rank Polymorphism 

* https://stackoverflow.com/a/10470321/184528 - StackOverflow answer to "what is full type inference" by Andreas Rossberg, 2012
* https://downloads.haskell.org/~ghc/latest/docs/html/users_guide/glasgow_exts.html#arbitrary-rank-polymorphism 

## On Polymorphic Type Inference

* http://cs.au.dk/~mis/typeinf.pdf - Polymorphic Type Inference by Michael I. Schwartzback, March 1995
* http://delivery.acm.org/10.1145/2910000/2908119/p27-noonan.pdf?ip=135.19.58.177&id=2908119&acc=CHORUS&key=4D4702B0C3E38B35%2E4D4702B0C3E38B35%2E4D4702B0C3E38B35%2E6D218144511F3437&CFID=840515719&CFTOKEN=36842691&__acm__=1513267013_22d16f287c9ef9a0075691b0af07e0ab - Polymorphic Type Inference for Machine Code

# More references 

J. Palsberg, M. Wand, and P. O’Keefe. Type inference with
non-structural subtyping. Formal Aspects of Computing, 9(1):
49–67, 1997.

# Todo:
https://stackoverflow.com/questions/22060592/growth-of-type-definition-in-sml-using-hindley-milner-type-inference/22061847#22061847

# Embedding Type Systems in 

http://www.brics.dk/RS/98/12/BRICS-RS-98-12.pdf - Danvy (1998) Functional Unparsing 
http://www.cs.ox.ac.uk/ralf.hinze/publications/Quote.pdf -  Functional pearl: Typed quote/antiquote
http://alaska-kamtchatka.blogspot.ca/2009/01/essence-of-concatenative-languages.html - The essence of Concatenative Languages

# The Big Problem

How do you encoding: 

[apply] dup ? 

The system will generate: 

apply : (('S -> 'S1) 'S -> 'S1)
dup : ('A 'S -> 'A 'A 'S) 

(('A -> 'B) 'S -> ('A -> B) ('A -> 'B) 'S)

Or:

[dup] dup 

('_ -> ('a 's -> 'a 'a 's) ('a 's -> 'a 'a 's) '_)

I am two polymorphic functions on the stack, that use variables ('a and 's) but they are unrelated. 

Note that these polymorphic variables were generated from unification. So the point is that whenever I generate a new function (perhaps when I substitute it somewhere, I have to uniquely rename the variables)

The thing is that after application, the type variables 'A and 'B in the first function are different from those in the second. 

The function remains polymorphic! 

http://lambda-the-ultimate.org/node/1899#comment-23169
https://www.reddit.com/r/ocaml/comments/5yukrx/type_inference_in_stackbased_programming_languages/ 
http://prl.ccs.neu.edu/blog/static/stack-languages-talk-notes.pdf 

//==

Type Inference for Stack-based Languages

http://prl.ccs.neu.edu/blog/2017/03/10/type-inference-in-stack-based-programming-languages/
http://prl.ccs.neu.edu/blog/static/stack-languages-annotated-bib.pdf 

//==

https://github.com/robertkleffner/CaKe

//==
The problem with [dup] dup.

So when I apply a function to a polymorphic function, I am going to end up with some type variables on the right side that might get repeated. 

So one way of phrasing the question: am I making a copy of a polymorphic type? If so, create fresh new type variables.
Then the question is: how do I know if a type is polymorphic? In other words: how do I know that the variables belong to it? 
This is why a type scheme is used. The problem with a type scheme, is that the type variables can get referenced outside, and it becomes relevant. 

Can I just look at a type, and figure out whether it is polymorphic? 

For now I can say: only functions are polymorphic. 

Is there a relationship between left and right types? 

Things start out fine: every function is first order polymorphic. Then when I unify to get a right hand-side, things go to heck. 

So I ask the question: am I unifying a polymorphic type with another type? Then I have polymorphic. 

//==

# Higher Order Polymorphism 

https://stackoverflow.com/questions/5557525/higher-order-polymorphism-value-types - In short, combined (some form of) polymorphism with rich data representation choices is possible, but much harder than in the uniform representation case. - gasche

https://stackoverflow.com/questions/7061538/polymorphism-within-higher-order-functions - As an aside, regarding higher-rank polymorphic types--keep in mind that the forall is what actually binds the variable to a type; you can think of them as behaving a lot like a lambda, in fact. When you apply such a function to something with a concrete type, the type of the argument is implicitly bound by the forall for that use. This comes up, for instance, if you try to use a value whose type was bound by an inner forall outside that function; the value's type has gone out of scope, which makes it difficult to do anything sensible (as you can probably imagine).

Why is it important in stack-based languages? It is very reasonable to place a higher-order polymorphic function on the stack. Consider the example "[dup]" which quites the "dup" operation and places it on the stack. Next call dup again, and you end up with two similar but unconnected polymorphic functions. This could be expressed as:

(S -> (a -> a a S) (a -> a a S) S) 

However the 'S and the 'a are not the same. We need to generate fresh variables. The desired result is:

!S.(S -> !a.!S.(a -> a a S) !a.!S.(a -> a a S) S) 

Alternatively we could write:

(S -> (a -> a a R) (b -> b b T) S) 

And leave all of the "forall" qualifiers at the top level. 

It is implied in this case that all type variables are implicitly uni

http://lambda-the-ultimate.org/node/1899#comment-23192 - Algorithmically, you use the fresh-type-variables-and-unification approach I was mentioning to implement this: instead of some ti or rj you substitute fresh unification variables and determine the actual types they represent incrementally by unification based on the constraints imposed from the other rules downstream. In this system, the only rule that actually imposes a constraint is the COMPOSE rule - Andreas Rossberg

https://www.stephanboyer.com/post/115/higher-rank-and-higher-kinded-types - You may know that in most modern programming languages, functions are first-class values—they can be stored in variables, passed to functions, etc. In most statically-typed programming languages, however, polymorphic functions are not first-class. You cannot pass chooseValue to another function or store it in a variable, and then apply it polymorphically later on. Whenever you want to refer to it, you must specify up front (explicitly or implicitly) a type for T, thereby converting it into a monomorphic function. The idea of higher-rank types is to make polymorphic functions first-class, just like regular (monomorphic) functions. - Stephan Boyer

//==

Notes to self:

1) I could track in each type what the for-all type variables are and then simply rename them.
The challenge with this is that during unification I have to know what type scheme each variable comes from.

2) I think that this extra complication is probably why people opt for simple HM type inference.1

# Higher Order Polymorphic Inference

https://www.cs.cmu.edu/~fp/papers/CMU-CS-92-105.pdf - 
We prove that partial type reconstruction for the pure polymorphic λ-calculus is undecidable by a
reduction from the second-order unification problem, extending a previous result by H.-J. Boehm.
We show further that partial type reconstruction remains undecidable even in a very small predicative
fragment of the polymorphic λ-calculus, which implies undecidability of partial type reconstruction
for λML as introduced by Harper, Mitchell, and Moggi

https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/putting.pdf - 

Complete type inference is known to be undecidable for higher-rank (impredicative)
type systems, but in practice programmers are more than willing to add type annotations
to guide the type inference engine, and to document their code. However, the choice of
just what annotations are required, and what changes are required in the type system and
its inference algorithm, has been an ongoing topic of research.
We take as our starting point a λ-calculus proposed by Odersky and L¨aufer. Their system
supports arbitrary-rank polymorphism through the exploitation of type annotations
on λ-bound arguments and arbitrary sub-terms. Though elegant, and more convenient
than some other proposals, Odersky and L¨aufer’s system requires many annotations. We
show how to use local type inference (invented by Pierce and Turner) to greatly reduce
the annotation burden, to the point where higher-rank types become eminently usable.
Higher-rank types have a very modest impact on type inference. We substantiate this
claim in a very concrete way, by presenting a complete type-inference engine, written in
Haskell, for a traditional Damas-Milner type system, and then showing how to extend it
for higher-rank types. We write the type-inference engine using a monadic framework: it
turns out to be a particularly compelling example of monads in action.

This is a long paper, but it has a simple conclusion: higher-rank types are definitely useful, occasionally indispensable, and much easier to implement than one might guess. Every language should have them!

Practical type inference for arbitrary-rank types - Jones et Al 31 July 2007

https://stackoverflow.com/a/15498948/184528 - The HM algorithm distinguishes types (without quantifiers, monotypes) and type schemas (universaly quantified types, polytypes). It's important that at some places it uses type schemas (like in let), but at other places only types are allowed. This makes the whole thing decidable.

I also suggest you to read the article about System F. It is a more complex system, which allows forall anywhere in types (therefore everything there is just called type), but type inference/checking is undecidable. It can help you understand how forall works. System F is described in depth in Girard, Lafont and Taylor, Proofs and Types.

//==

* So what are my options?
* Use a type scheme variable.
* I need to compute type schemes for a type (the set of bound variables for that type)
* This is feasible. 
* What happens if a type scheme type is referenced outside of the polytype? In other words if there is a constraint? 
* It becomes a type variable outside of the original scheme. 
* Does every type have a type scheme? 
* For me it should be easy: there are only type arrays. 
* I can separate it out into its own phase: compute type schemes. 
* Then when unifying a type: I am copying its type scheme. 
* Finding a type for a variable becomes a bit easier. 
* A type variable needs a type scheme: the type scheme helps to uniquely identify the variable. 
* So you have an environment of type schemes? 

* There are two things we do.
1) We compose functions. A->B C->D (unify B and C and put the result into D)
2) We apply functions to stacks A->B (A) generates a stack (B)

These are both similar problems. When unifying we have to work out what variables belong to what. 

This can be done manually. We can actually work out the types during unification. 

It makes using the algorithm much simpler. I have to "edit" the type variables, which is fine I guess. 

WAIT: the right hand side ... "getting the unified type" is the only time that this shit really matters isn't it? 

What I am saying is that if the unifier has a type variable, then the type should be alpha renamed. 

Just keep generating fresh variables. And unify as much as possible at each step. 

Whenever a TypeVariable unifier gets a TypeArray I should replace all instances of that TypeVars in all TypeArrays with the unified version. 

//==

Okay, so now I have a type scheme. 

TODO: explain what A type scheme is. 

//==

What happens when I try to unify a nested type twice? Say for example:

!a.(a -> !b.(a -> b)) <=> !c.(int -> c c) ?

This is illegal: You can't just start plucking type variables out of thin air on the right hand side. They have to occur 
on the left first. Don't they?

So: that is a very interesting restriction that could be useful for some proofs. 

So then what about: 

!a.(a !b.(a -> b) -> int) <=> !c.(int c -> int)?

Now in this case . . . 

Again not a problem really? 

Remember: I can't compose, except with the results. 

(A -> B) (C -> D)

Implies B <=> C.

Interesting BECAUSE it is subject to rules that new type schemes never appear in B? 

(A -> B) is an illegal function. 
(A -> (A -> B)) is also an illegal function. 

((A -> B) -> (A -> B)) is however legal, notice because the Type schemes don't appear. 

Can I prove that this never happens? Well I can test that this never happens in a language like Cat. 

//==

So what I am trying to say is that polytypes are never generated. 

What is important to note about this type system is that it has something special to say about functions. 
That is fine. It can probably be dealt with outside of the "type_inference" side? 

//==

# System F is Undecidable

Man polymorphic type systems are based  of System F. It has been proven that type checking, and consequently
type inference/reconstruction, is undecidable for System F. There are two restricted forms of System F which are known to be decidable for type-innference:

1) Rank-1 Prenex polymorphism
2) Rank-2 polymorphism 

There are 

There is a rule that top-level function types cannot generate new polymorphic types

https://en.wikipedia.org/wiki/Parametric_polymorphism
https://en.wikipedia.org/wiki/Hindley%E2%80%93Milner_type_system 
https://en.wikipedia.org/wiki/System_F

# Reconstructing the Type Scehemes 

This type system uses an algorithm to compute polytypes without type annotations based on a rule: assuming all type variables are uniqely named, a type variable belongs to the type scheme of the most recent polytype, that references all instances of the type variable. 

This is based on the intuition that: 

(a (b a) -> int)

# Motivations 

Given a stack language we want to be able to express the type of: 

```
  [dup] dup 
```

So for example: 

```
  3 "hello" [dup] dup dip2 apply => 3 3 "hello" "hello"
```

Here is the result of applying the function step by step: 

```
  3 
  3 "hello" 
  3 "hello" [dup] 
  3 "hello" [dup] [dup] 
  3 3 "hello" [dup] 
  3 3 "hello" "hello" 
```

We don't want to 

# The Core Type System

I believe all other rules can be defined from these: 

apply : !a!b.((a -> b) a -> b) 
compose : !a!b!c!d.((b -> c) (a -> b) d -> (a -> c) d)
quote : !a!b.(a b -> !c.(c -> a c) b)
dup : !a!b.(a b -> a (a b))
swap : !a!b!c.(a (b c) -> b (a c))

# A Higher Rank Type Inference Algorithm

This document describes a type inference (type reconstruction) algorithm for higher-rank polymorphism 
Constructing a type system for a functional stack language without user defined type annotations that supports polrymorph

The proposed type system is more powerful than a rank-1 (prenex) polymorphic type system: it allows polytypes as first class citizens (e.g. arguments to functions and as function results). 

We introduce a restriction compared to impredicative type systems: top-level functions that generate polymorphic functions that generate polytypes are illegal. (Really???)

Viewed as a tree: no right most derivation of the   ... 

//==

I'm not sure about this restriction. 

Sounds to me like I am defining a kind of rank-2 polymorphism.

# Discussion on Higher Rank Polymorphism

https://softwareengineering.stackexchange.com/questions/277048/is-higher-rank-parametric-polymorphism-useful/277069#277069 - In general, you use higher-rank polymorphism when you want the callee to be able to select the value of a type parameter, rather than the calle

https://github.com/elm-lang/elm-compiler/issues/238

https://prime.haskell.org/wiki/Rank2Types - 


https://stackoverflow.com/questions/12031878/what-is-the-purpose-of-rank2types - 
https://apocalisp.wordpress.com/2010/07/02/higher-rank-polymorphism-in-scala/ - 

The definitive paper: http://research.microsoft.com/Users/simonpj/papers/higher-rank/


//== 

TODO:
1. Test the type renaming. 
2. Test the type cloning.

//==

Two things to notice:

1) Swap swap is not unifying correctly.
2) I am getting a lot of "different sized lists can't be unified". This is bogus.

For example "swap quote"

Right now: 
pop pop -> generating a "single type".

# Encoding the SKI Calculus in a Concatenative Language

In a concatenative language function application is not implied: each combinator just puts a quotation on the stack. Applying the combinator to the stack is an explicit operation specified using A. 

1. y x K A A => x
2. z y x S A A A => z y A z x A A
3. x I A => x
4. x K K S A A A => x K A x K A A == y I

K = [quote [pop] rcompose] 
S = ??
I = [quote]

## Proving that the definition of SKK is equivalent to I 

// x K A x K A A 

x 
[pop x] x
[pop x] [pop x]
x

## Term Rewriting 


//==

1. compose apply failed when it shouldn't.
1. apply pop give the wrong type.
