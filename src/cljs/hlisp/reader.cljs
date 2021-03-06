(ns hlisp.reader
  (:require [cljs.reader :as reader]))

(declare read-form)

;; An empty attribute list.
(def empty-attrs '(()))

(defn valid-node-expr? [expr]
  (and (seq? expr) (symbol? (first expr))))

(defn valid-attrlist? [attrs]
  (and (seq? attrs) (seq? (first attrs))))

(defn text-node [txt]
  (list (symbol "#text") (str txt)))

(defn parse-symbol [expr]
  (when (symbol? expr)
    (list expr empty-attrs)))

(defn parse-seqable-literal [pred valtag]
  (fn [expr]
    (when (pred expr)
      (let [[head & tail] expr
            attrs   (if (valid-attrlist? head) head empty-attrs)
            items   (if (= empty-attrs attrs) expr tail)]
        (concat (list valtag attrs) (map read-form items))))))

(defn parse-atomic-literal [pred valtag]
  (fn [expr]
    (when (pred expr)
      (list valtag empty-attrs (text-node (str expr))))))

(defn parse-bool-literal [expr]
  (or ((parse-atomic-literal true?  'val:true)  expr) 
      ((parse-atomic-literal false? 'val:false) expr)))

(defn parse-nil-literal [expr]
  ((parse-atomic-literal nil? 'val:nil) expr))

(defn parse-map-literal [expr]
  (when-let [m ((parse-seqable-literal map? 'val:map) expr)]
    (concat (take 2 m) (mapcat (partial drop 2) (drop 2 m)))))

(defn parse-set-literal [expr]
  ((parse-seqable-literal set? 'val:set) expr))

(defn parse-vector-literal [expr]
  ((parse-seqable-literal vector? 'list) expr))

(defn parse-string-literal [expr]
  ((parse-atomic-literal string? 'val:str) expr))

(defn parse-number-literal [expr]
  ((parse-atomic-literal number? 'val:num) expr))

(defn parse-text-node [expr]
  (let [[text & more] expr]
    (when (and (string? text) (nil? (seq more))) 
      (text-node text))))

(defn parse-node [expr]
  (when (valid-node-expr? expr)
    (let [[tag attrs & children] expr]
      (if (valid-attrlist? attrs)
        (concat (list tag attrs)
                (map read-form children))
        (parse-node
          (remove nil? (concat (list tag empty-attrs attrs) children)))))))

(defn read-form [expr]
  (or
    (parse-symbol         expr)
    (parse-bool-literal   expr)
    (parse-nil-literal    expr)
    (parse-map-literal    expr)
    (parse-set-literal    expr)
    (parse-vector-literal expr)
    (parse-string-literal expr)
    (parse-number-literal expr)
    (parse-text-node      expr)
    (parse-node           expr)
    (assert false (str "read-form: " expr " isn't a valid expression"))))

(defn read-forms [forms]
  (map read-form forms))

(defn read-string [s]
  (read-forms (reader/read-string (str "(" s "\n)"))))

(defn readit [s]
  (reader/read-string s))

