import { useContractReads } from "wagmi";
import { useDeployedContractInfo, useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { getTargetNetwork } from "~~/utils/scaffold-eth";
import { AbiFunctionReturnType, ContractAbi } from "~~/utils/scaffold-eth/contract";

export const useCommentsReader = (voteCount: bigint | undefined) => {
  const { data: deployedContract } = useDeployedContractInfo("CommunityVerifier");
  const contractReadsParams = [];
  for (let i = 1; i <= (voteCount || 0); i++) {
    const args = [BigInt(i)];
    contractReadsParams.push({
      chainId: getTargetNetwork().id,
      contractName: "CommunityVerifier",
      functionName: "votes",
      address: deployedContract?.address,
      abi: deployedContract?.abi,
      args,
    });
  }
  return useContractReads({ contracts: contractReadsParams, watch: true, enabled: !!voteCount }) as unknown as Omit<
    ReturnType<typeof useContractReads>,
    "data" | "refetch"
  > & {
    data: AbiFunctionReturnType<ContractAbi, "votes"> | undefined;
    refetch: (options?: {
      throwOnError: boolean;
      cancelRefetch: boolean;
    }) => Promise<AbiFunctionReturnType<ContractAbi, "votes">>;
  };
};
