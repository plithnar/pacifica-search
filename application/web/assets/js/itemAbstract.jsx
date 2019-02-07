import React, {Component} from 'react';

export default class ItemAbstract extends Component{
    constructor(props) {
        super(props);

        this.state = {
            showTruncate: false,
            truncate: false,
        };
        this.toggleAbstract = this.toggleAbstract.bind(this);
    }

    componentDidMount() {
        const height = this.abstractElement.clientHeight;
        if(height > 60) {
            this.setState({
                showTruncate: true,
                truncate: true,
            })
        }
    }

    toggleAbstract() {
        this.setState({truncate: !this.state.truncate});
    }

    render() {
        const abstractText = this.props.abstractText;
        return (
            <div>
                <p
                    ref={(abstractElement) => this.abstractElement = abstractElement}
                    className={this.state.truncate ? 'truncate-abstract': ''}
                >
                    <b>Abstract:</b> {abstractText}
                </p>
                {this.state.showTruncate ? (
                    <div>
                        {this.state.truncate ? (
                            <div onClick={this.toggleAbstract} style={{'color':'#08c'}}>Display full abstract</div>
                        ) : (
                            <div onClick={this.toggleAbstract} style={{'color':'#08c'}}>Display truncated abstract</div>
                        )}
                    </div>
                ) : <div />}
            </div>
        )
    }
}
