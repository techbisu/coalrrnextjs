export interface IPlotRepository {
  findAllPlots(): Promise<any[]>
  /** Count plot schedule entries for a specific proposal */
  countByProposalId(proposalId: string): Promise<number>
}
