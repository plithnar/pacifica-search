import React, {Component} from 'react';
import ItemAbstract from './itemAbstract';
import CollapsiblePanel from './collapsiblePanel';

export default class ProjectMetadata extends Component {
    constructor(props) {
        super(props);
    }

    renderAbstract(abstractText) {
        return (
            <ItemAbstract abstractText={abstractText} />
        );
    }

    renderDates(metadata) {
        return (
            <div>
                <ul style={{columns: 3, 'listStyleType': 'none'}}>
                    <li><b>Project Started:</b> {metadata.actual_start_date}</li>
                    <li><b>Project Estimated End:</b> {metadata.actual_end_date}</li>
                    <li><b>Project Closed:</b> {metadata.closed_date ? metadata.closed_date : 'Currently Active'}</li>
                </ul>
            </div>
        )
    }

    renderUsers(users) {
        let pi_members = users.principle_investigator.length;
        if(users.co_principle_investigator) {
            pi_members += users.co_principle_investigator.length;
        }
        return (
            <div style={{display: 'inline-flex', width:'100%'}}>
                {users.principle_investigator.length > 0 && (
                    <div style={{padding: '0px 25px',width:'33%'}}>
                        {this.renderMembers(users.principle_investigator, 'Principal Investigators', 1)}
                    </div>
                )}
                {users.co_principle_investigator && users.co_principle_investigator.length > 0 && (
                    <div style={{padding: '0px 25px',width:'33%'}}>
                        {this.renderMembers(users.co_principle_investigator, 'Co-Principal Investigators', 1)}
                    </div>
                )}
                {users.member_of.length > pi_members && (
                    <div style={{padding: '0px 25px',width:'33%'}}>
                        {this.renderMembers(
                            users.member_of.filter((user) => (!users.principle_investigator.map((pi) => (pi.obj_id)).includes(user.obj_id)))
                                .filter((user) => ((!users.co_principle_investigator) || (users.co_principle_investigator && !users.co_principle_investigator.map((copi) => (copi.obj_id)).includes(user.obj_id)))),
                            'Other Team Members', 2)}
                    </div>
                )}
            </div>
        )
    }

    renderMembers(members, header, columns=3) {
        const content = [];
        const distinctMembers = [...new Set(members.map((member) => (member.display_name)))];
        distinctMembers.sort().forEach((member, index) => {
            content.push(<li key={index}>{member}</li>)
        });

        return (
            <div>
                {header && (
                    <div>
                        <b>{header}</b>
                    </div>
                )}
                <ul style={{columns}}>
                    {content}
                </ul>
            </div>
        )
    }

    renderInstruments(metadata) {
        return (
            <div>
                {metadata.instruments.length > 0 && (
                    this.renderMembers(metadata.instruments)
                )}
            </div>
        );
    }

    renderInstitutions(metadata) {
        return (
            <div>
                {metadata.institutions.length > 0 && (
                    this.renderMembers(metadata.institutions)
                )}
            </div>
        );
    }

    render() {
        const metadata = this.props.metadata;

        return (
            <div>
                <CollapsiblePanel title="Project Data" collapsed={false} titleColor="#08c">
                    <div>
                        <b>Project Title:</b> {metadata.title} (#{metadata.obj_id.split('_')[1]})
                    </div>
                    <br />
                    {this.renderAbstract(metadata.abstract)}
                    <br />
                    <ul style={{columns: 2, 'listStyleType': 'none'}}>
                        <li>
                            <b># Archived Datasets:</b> {metadata.transaction_ids.length}
                        </li>
                        <li>
                            <b># Open Access Datasets:</b> {this.props.released}
                        </li>
                    </ul>
                    <br />
                    {this.renderDates(metadata)}
                </CollapsiblePanel>
                <hr />
                <CollapsiblePanel title="Project Members" collapsed={false} titleColor="#08c">
                    {this.renderUsers(metadata.users)}
                </CollapsiblePanel>
                <hr />
                <CollapsiblePanel title="Utilized Instruments" collapsed={false} titleColor="#08c">
                    {this.renderInstruments(metadata)}
                </CollapsiblePanel>
                <hr />
                <CollapsiblePanel title="Collaborating Institutions" collapsed={false} titleColor="#08c">
                    {this.renderInstitutions(metadata)}
                </CollapsiblePanel>
            </div>
        )
    }
}