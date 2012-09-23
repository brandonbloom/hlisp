(ns hlisp.main
  (:require
    [jayq.core            :as   jq]
    [goog.dom             :as   gdom])
  (:use
    [jayq.util            :only [clj->js]]
    [hlisp.primitives     :only [prims]]
    [hlisp.util           :only [tee]]
    [hlisp.dom            :only [read-dom
                                 write-dom]]
    [hlisp.reader         :only [read-forms
                                 read-string]]
    [hlisp.interpreter    :only [eval*
                                 bind-primitive!]]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; hlisp -> DOM ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def xhr-opts
  {:async     false
   :dataType  "text"
   :type      "GET"
   })

(defn status-ok? [status]
  (and (>= status 200) (< status 300)))

(defn xhr [uri & {:keys [opt]}] 
   (let [ret      (.ajax js/jQuery (str uri) (clj->js (into xhr-opts opt)))
         status   (.-status       ret)
         message  (.-statusText   ret)
         text     (.-responseText ret)]
     (assert (status-ok? status) (str status " " message))
     text))

(defn load-remote-scripts []
  (mapv (comp xhr #(-> (jq/$ %) (jq/attr "src"))) 
        (-> (jq/$ "head") (jq/find "script[type='text/hlisp'][src]")))) 

(defn init []
  (let [body      (-> js/document .-body)
        $body     (jq/$ body)
        scrp-src  (first (mapv read-string (load-remote-scripts)))
        body-src  (drop 2 (vec (first (read-dom body))))]
    (jq/empty $body)
    (mapv #(-> $body (jq/append %))
          (concat (map write-dom (eval* scrp-src)) 
                  (map write-dom (eval* body-src))))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; hlisp -> DOM ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(bind-primitive! prims)

(jq/document-ready init)


