export interface IDocumentQueryService {
  getProposal(proposalId: string, includeRelations?: boolean): Promise<any>
  getProposalByProjectOrNumber(proposalId: string, includeRelations?: boolean): Promise<any>
  getProject(projCd: string): Promise<any>
  getMineMaster(mineCd: string): Promise<any>
  getAreaMaster(areaCd: string): Promise<any>
  getPlots(id: string, isUuid: boolean, includeRelations?: boolean, mineCd?: string): Promise<any[]>
}
