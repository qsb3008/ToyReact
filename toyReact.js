class ElementWrapper {
    constructor (type) {
        this.root = document.createElement(type)
    }
    setAttribute (name, value) {
        this.root.setAttribute(name, value)
    }
    appendChild (component) {
        this.root.appendChild(component.root)
    }
}

class TextWrapper {
    constructor (content) {
        this.root = document.createTextNode(content)
    }
}

export class Component {
    constructor () {
        this.props = Object.create(null)
        this.children = []
        this._root = null
    }
    setAttribute (name, value) {
        this.props[name] = value
    }
    appendChild (component) {
        this.children.push(component)
    }
    // 跟一般的html标签相比，自定义组件的root需要执行render才能获得
    // 并且赋值给root，最终希望变成一般的html标签
    get root () {
        if (!this._root) {
            // 这是一个递归
            // render出来的东西也是要经过createElement转一遍的
            // 如果转成了普通的html标签类型，必定有this.root
            // 如果没有root,那this.render() 返回的应该也是自定义组件,
            // 这个返回的自定义组件也会尝试判断!this._root，并进入到这里
            // 直到最终this.render()出来的对象有root
            this._root = this.render().root
        }
        return this._root
    }
}

export function render (comp, parentNode) {
    parentNode.appendChild(comp.root)
}

export function createElement (type, attrs, ...children) {
    let e
    if (typeof type === 'string') {
        // ElementWrapper里面有setAttribute,appendChild、root
        e = new ElementWrapper(type)
    } else {
        // 这是实例化的组件，继承了Component
        // 它里面也有setAttribute,appendChild、root
        e = new type()
    }
    for (let key in attrs) {
        // 经过ElementWrapper和Component的包装
        // 已经抹平了常规的html标签'div'，自定义组件<MyComp></MyComp>的差异
        // 此时他们都有setAttribute
        e.setAttribute(key, attrs[key])
    }
    let insertChildren = (children) => {
        for (const child of children) {
            if (typeof child === 'string') {
                child = new TextWrapper(child)
            } 
            if (Array.isArray(child)){
                insertChildren(child)
            } else {
                e.appendChild(child)
            }
        }
    }
    insertChildren(children)
    return e
}