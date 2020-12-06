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
            <div>a: {this.state.a.toString()}</div>
            <div>b: {this.state.b.toString()}</div>
            <hr/>
            <button onclick={() => {
                this.setState({
                    a: this.state.a + 1
                })
            }}>add</button>
        </div>
    }
}

render(<MyComponent className="a" name="b">
</MyComponent>, document.body)
