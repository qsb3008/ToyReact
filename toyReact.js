// 相当于生成一个私有变量，比较不容易被访问到
const RENDER_TO_DOM = Symbol('render to dom')

export class Component {
    constructor () {
        this.props = Object.create(null)
        this.children = []
        this._root = null
        this._range = null
    }
    setAttribute (name, value) {
        this.props[name] = value
    }
    appendChild (component) {
        this.children.push(component)
    }
    [RENDER_TO_DOM] (range) {
        // 因为后面要重新绘制，所以要先存起来
        this._range = range
        // this.render, 是我们自动组件里面的 render () { return <jsx></jsx> }
        this.render()[RENDER_TO_DOM](range)
    }
    get vdom () {
        return this.render().vdom
    }
    rerender () {
        /* 下面逻辑后面也得改掉，换成虚实dom对比 */ 
        let oldRange = this._range
        // 直接删除会有bug，删除当前节点下次插入会被吞进下一个节点
        // 所以删除之前要先存起来，
        // this._range.deleteContents(); // 这个注释掉，不能直接删除
        // range 相关api：https://developer.mozilla.org/zh-CN/docs/Web/API/Range
        let range = document.createRange()
        // 例子[a]|[b]，假如要删除b再插入b的位置，实际就是相当于b前面的|空间，所以：
        // setStart和setEnd的位置是相同的
        range.setStart(oldRange.startContainer, oldRange.startOffset)
        range.setEnd(oldRange.startContainer, oldRange.startOffset)
        this[RENDER_TO_DOM](range)

        // [a][new b][b],因为上面已经插入了new b, [b]的范围要重新设定一下
        // 【new b】的最后元素的end开始删除到末尾
        oldRange.setStart(range.endContainer, range.endOffset)
        oldRange.deleteContents()
    }
    setState (newState) {
        if (this.state === null || typeof  this.state !== 'object') {
            this.state = newState
            this.rerender()
            return
        }
        let merge = (oldState, newState) => {
            for (let p in newState) {
                if (oldState[p] === null || typeof oldState[p]  !== 'object') {
                    oldState[p] = newState[p]
                } else {
                    merge(oldState[p], newState[p])
                }
            }
        }
        merge(this.state, newState)
        this.rerender()
    }
}

class ElementWrapper extends Component {
    constructor (type) {
        super(type)
        this.type = type
        this.root = document.createElement(type)
    }
    // setAttribute (name, value) {
    //     if (name.match(/^on([\s\S]+)$/)) {
    //         this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLocaleLowerCase()), value)
    //     } else {
    //         if (name === 'className') {
    //             this.root.setAttribute('class', value)
    //         } else {
    //             this.root.setAttribute(name, value)
    //         }
    //     }
    // }
    // appendChild (component) {
    //     let range = document.createRange()
    //     // 注意这个位置，因为这里是appendChild操作，即插入最后
    //     // 所以range不是[0,length]而是[length,length]
    //     range.setStart(this.root, this.root.childNodes.length)
    //     range.setEnd(this.root, this.root.childNodes.length)
    //     component[RENDER_TO_DOM](range)
    // }
    get vdom () {
        return {
            type: this.type,
            props: this.props,
            children: this.children.map(child => child.vdom)
        }
    }
    [RENDER_TO_DOM] (range) {
        range.deleteContents()
        range.insertNode(this.root)
    }
}

class TextWrapper  extends Component {
    constructor (content) {
        super(content)
        this.content = content
        this.root = document.createTextNode(String(content))
    }
    [RENDER_TO_DOM] (range) {
        range.deleteContents()
        range.insertNode(this.root)
    }
    get vdom () {
        return {
            type: '#text',
            content: this.content
        }
    }
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
            if (typeof child === 'string' || typeof child === 'number') {
                child = new TextWrapper(child)
            } 
            if (child === null) {
                continue
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

export function render (comp, parentElement) {
    /**
     * 之前是操作真实dom，渲染完就没后续了
     * 如果要重新渲染页面，我们不可能再一个个找到dom元素修改
     */
    // 为了能够重新渲染，使用range
    // 但是这种方式每次会渲染整个树，后期依然要改造
    let range = document.createRange()
    range.setStart(parentElement, 0)
    range.setEnd(parentElement, parentElement.childNodes.length)
    range.deleteContents()
    comp[RENDER_TO_DOM](range)
}