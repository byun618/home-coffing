export interface AcceptInvitationResponse {
  cafeId: number;
  cafeName: string;
  role: 'admin' | 'member';
  invitationId: number;
  invitedBy: number;
}
