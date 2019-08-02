import React, {Component} from 'react';
import ItemAbstract from './itemAbstract';

export default class ProjectListItem extends Component {
    constructor(props) {
        super(props);
    }

  renderAbstract(abstractText) {
    return (
      <ItemAbstract abstractText={abstractText}/>
    );
  }
    render() {
        const source = this.props.result._source;
        return(
            <div className="transactionResultHit">
                <b>Project:</b> {source.title} (#{source.obj_id.split('_')[1]}) <br />
              {this.renderAbstract(source.abstract)}

            </div>
        );
    }
}