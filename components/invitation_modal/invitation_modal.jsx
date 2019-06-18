// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, intlShape} from 'react-intl';

import FullScreenModal from 'components/widgets/modals/full_screen_modal';
import ConfirmModal from 'components/confirm_modal.jsx';
import RootPortal from 'components/root_portal';

import {InviteTypes} from 'utils/constants.jsx';

import InvitationModalInitialStep from './invitation_modal_initial_step.jsx';
import InvitationModalMembersStep from './invitation_modal_members_step.jsx';
import InvitationModalGuestsStep from './invitation_modal_guests_step.jsx';
import InvitationModalConfirmStep from './invitation_modal_confirm_step.jsx';

import './invitation_modal.scss';

const STEPS_INITIAL = 'initial';
const STEPS_INVITE_MEMBERS = 'members';
const STEPS_INVITE_GUESTS = 'guests';
const STEPS_INVITE_CONFIRM = 'confirm';

export default class InvitationModal extends React.Component {
    static propTypes = {
        show: PropTypes.bool,
        currentTeam: PropTypes.object.isRequired,
        invitableChannels: PropTypes.array.isRequired,
        canInviteGuests: PropTypes.bool.isRequired,
        canAddUsers: PropTypes.bool.isRequired,
        actions: PropTypes.shape({
            closeModal: PropTypes.func.isRequired,
            sendGuestsInvites: PropTypes.func.isRequired,
            sendMembersInvites: PropTypes.func.isRequired,
            searchProfiles: PropTypes.func.isRequired,
        }).isRequired,
    }

    static contextTypes = {
        intl: intlShape.isRequired,
    };

    constructor(props) {
        super(props);
        let step = STEPS_INITIAL;
        if (!props.canInviteGuests) {
            step = STEPS_INVITE_MEMBERS;
        }

        if (!props.canAddUsers) {
            step = STEPS_INVITE_GUESTS;
        }

        this.state = {
            step,
            confirmModal: false,
            hasChanges: false,
            invitesType: InviteTypes.INVITE_MEMBER,
            invitesSent: [],
            invitesNotSent: [],
        };
    }

    goToInitialStep = () => {
        this.setState({step: STEPS_INITIAL, hasChanges: false});
    }

    goToMembers = () => {
        this.setState({step: STEPS_INVITE_MEMBERS, hasChanges: false, invitesSent: [], invitesNotSent: [], invitesType: InviteTypes.INVITE_MEMBER});
    }

    goToGuests = () => {
        this.setState({step: STEPS_INVITE_GUESTS, hasChanges: false, invitesSent: [], invitesNotSent: [], invitesType: InviteTypes.INVITE_GUEST});
        this.setState({});
    }

    onEdit = () => {
        this.setState({hasChanges: true});
    }

    close = () => {
        if (this.state.hasChanges) {
            this.setState({confirmModal: true});
        } else {
            this.props.actions.closeModal();
        }
    }

    confirmClose = () => {
        this.props.actions.closeModal();
        this.setState({confirmModal: false});
    }

    cancelConfirm = () => {
        this.setState({confirmModal: false});
    }

    onMembersSubmit = async (users, emails) => {
        const invites = await this.props.actions.sendMembersInvites(this.props.currentTeam.id, users, emails);
        this.setState({step: STEPS_INVITE_CONFIRM, invitesSent: invites.sent, invitesNotSent: invites.notSent, invitesType: InviteTypes.INVITE_MEMBER, hasChanges: false});
    }

    onGuestsSubmit = async (users, emails, channels, message) => {
        const invites = await this.props.actions.sendGuestsInvites(
            this.props.currentTeam.id,
            channels.map((c) => c.id),
            users,
            emails,
            message,
        );
        this.setState({step: STEPS_INVITE_CONFIRM, invitesSent: invites.sent, invitesNotSent: invites.notSent, invitesType: InviteTypes.INVITE_GUEST, hasChanges: false});
    }

    render() {
        return (
            <RootPortal>
                <FullScreenModal
                    show={Boolean(this.props.show)}
                    onClose={this.close}
                >
                    <div className='InvitationModal'>
                        <ConfirmModal
                            show={this.state.confirmModal}
                            title={
                                <FormattedMessage
                                    id='invitation-modal.discard-changes.title'
                                    defaultMessage='Discard Changes'
                                />
                            }
                            message={
                                <FormattedMessage
                                    id='invitation-modal.discard-changes.message'
                                    defaultMessage='You have unsent invitations, are you sure you want to discard them?'
                                />
                            }
                            confirmButtonText={
                                <FormattedMessage
                                    id='invitation-modal.discard-changes.button'
                                    defaultMessage='Yes, Discard'
                                />
                            }
                            modalClass='invitation-modal-confirm'
                            onConfirm={this.confirmClose}
                            onCancel={this.cancelConfirm}
                        />
                        {this.state.step === STEPS_INITIAL &&
                            <InvitationModalInitialStep
                                teamName={this.props.currentTeam.display_name}
                                goToMembers={this.goToMembers}
                                goToGuests={this.goToGuests}
                            />
                        }
                        {this.state.step === STEPS_INVITE_MEMBERS &&
                            <InvitationModalMembersStep
                                inviteId={this.props.currentTeam.invite_id}
                                goBack={(this.props.canInviteGuests && this.props.canAddUsers && this.goToInitialStep) || null}
                                searchProfiles={this.props.actions.searchProfiles}
                                onSubmit={this.onMembersSubmit}
                                onEdit={this.onEdit}
                            />
                        }
                        {this.state.step === STEPS_INVITE_GUESTS &&
                            <InvitationModalGuestsStep
                                goBack={(this.props.canInviteGuests && this.props.canAddUsers && this.goToInitialStep) || null}
                                currentTeamId={this.props.currentTeam.id}
                                myInvitableChannels={this.props.invitableChannels}
                                searchProfiles={this.props.actions.searchProfiles}
                                onSubmit={this.onGuestsSubmit}
                                onEdit={this.onEdit}
                            />
                        }
                        {this.state.step === STEPS_INVITE_CONFIRM &&
                            <InvitationModalConfirmStep
                                teamName={this.props.currentTeam.display_name}
                                currentTeamId={this.props.currentTeam.id}
                                goBack={this.goToInitialStep}
                                onDone={this.close}
                                invitesType={this.state.invitesType}
                                invitesSent={this.state.invitesSent}
                                invitesNotSent={this.state.invitesNotSent}
                            />
                        }
                    </div>
                </FullScreenModal>
            </RootPortal>
        );
    }
}
