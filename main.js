import { createElement, render, Component } from './toyReact'

class MyComponent extends Component {
    constructor () {
        super()
        this.state = {
            a: 1,
            b: 2
        }
    }
    render() {
        return <div>
            i am component
    <span>{this.state.a.toString()}</span>
            {
                this.children
            }
        </div>
    }
}

render(<MyComponent className="a" name="b">
    222
    <div>12</div>
    <div></div>
</MyComponent>, document.body)
