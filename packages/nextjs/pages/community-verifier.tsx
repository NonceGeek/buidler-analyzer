import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import clsx from "clsx";
import fs from "fs";
import { NextPage } from "next";
import path from "path";
import ReactMarkdown from "react-markdown";
import { useAccount } from "wagmi";
import { ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import { useCommentsReader } from "~~/components/CommunityVerifierInteractor";
import TopicCard from "~~/components/TopicCard";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

interface ETHSpaceProps {
  markdownContentEn: string;
  markdownContentCn: string;
  linePositionsCn: Array<{ lineNumber: number; position: number; length: number }>;
  linePositionsEn: Array<{ lineNumber: number; position: number; length: number }>;
}

interface Note {
  id: string;
  line: number;
  word: string;
  note: string;
  author: string;
  created_at: string;
  version: "en" | "cn";
}

const ETHSpace: NextPage<ETHSpaceProps> = ({
  markdownContentEn,
  markdownContentCn,
  linePositionsCn,
  linePositionsEn,
}) => {
  const router = useRouter();
  const [postLoading, setPostLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(1);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isBool, setIsBool] = useState(false);
  const [isExpandedRight, setIsExpandedRight] = useState(true);
  const [language, setLanguage] = useState<"en" | "cn">("cn");
  const [notes, setNotes] = useState<Array<Note>>([]);
  const [combinedNotes, setCombinedNotes] = useState<Array<Note>>([]);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const markdownRef = useRef<HTMLDivElement>(null);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);

  const [notesLines, setNotesLines] = useState<Set<number>>(new Set());
  const [combinedNotesLines, setCombinedNotesLines] = useState<Set<number>>(new Set());
  const [urlLine, setUrlLine] = useState<number | null>(null);

  const [newNoteWord, setNewNoteWord] = useState("");

  const [votes, setVotes] = useState([]);

  const [newNoteContent, setNewNoteContent] = useState("");

  const { address } = useAccount();

  const { data: votesCount } = useScaffoldContractRead({
    contractName: "CommunityVerifier",
    functionName: "voteCount",
  });
  const votesReader = useCommentsReader(votesCount);

  const { writeAsync: createVote, isLoading: isCreatingVote } = useScaffoldContractWrite({
    contractName: "CommunityVerifier",
    functionName: "createVote",
    args: [address, "he is a good guy."],
    onSuccess: () => {
      console.log("Vote created successfully");
      // You can add additional logic here, such as showing a success message
    },
  });

  const [githubUsername, setGithubUsername] = useState("leeduckgo");
  const [analyzerData, setAnalyzerData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [memberAddress, setMemberAddress] = useState("");
  const { data: isMember, isLoading: isMemberCheckLoading } = useScaffoldContractRead({
    contractName: "CommunityVerifier",
    functionName: "isMember",
    args: [memberAddress],
  });

  const analyzeGithubUser = async () => {
    if (!githubUsername) {
      alert("Please enter a GitHub username");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch(`https://analyzer.deno.dev/analyze_user?username=${githubUsername}`);
      const data = await response.json();
      setAnalyzerData(data);
    } catch (error) {
      console.error("Error analyzing GitHub user:", error);
      alert("Failed to analyze GitHub user. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const { data: membersCount, isLoading: isMembersCountLoading } = useScaffoldContractRead({
    contractName: "CommunityVerifier",
    functionName: "membersCount",
  });

  const [animatedCount, setAnimatedCount] = useState("000000");

  useEffect(() => {
    if (membersCount) {
      const count = membersCount.toString().padStart(6, '0');
      setAnimatedCount(count);
    }
  }, [membersCount]);

  useEffect(() => {
    const { lang, line } = router.query;
    if (lang && (lang === "en" || lang === "cn")) {
      setLanguage(lang);
    }
    if (line && typeof line === "string") {
      const lineNumber = parseInt(line, 10);
      if (!isNaN(lineNumber)) {
        console.log("lineNumber", lineNumber);
        setUrlLine(lineNumber);
        setSelectedLine(lineNumber);

        // Automatically open the right sidebar
        setIsExpandedRight(true);

        // Add this new code to scroll to the selected line
        setTimeout(() => {
          const markdownContainer = markdownRef.current;
          if (markdownContainer) {
            const elements = markdownContainer.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li");
            const targetElement = elements[lineNumber - 1] as HTMLElement;
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }
        }, 100);
      }
    }
  }, [router.query]);

  useEffect(() => {
    console.log("votesReader.data");
    if (votesReader.data) {
      console.log("votesReader.data", votesReader.data);
      const formattedVotes = votesReader.data.map((vote: any, index: number) => {
        console.log(`Vote ${index}:`, vote);
        return {
          id: index+1,
          applicant: vote.result[0],
          deadline: new Date(Number(vote.result[1]) * 1000).toLocaleString(), // Convert BigInt to Date string
          aiSuggestion: vote.result[2],
          yesVotes: vote.result[3].toString(), // Convert BigInt to string
          noVotes: vote.result[4].toString(), // Convert BigInt to string
        };
      });
      setVotes(formattedVotes);
    }
  }, [votesReader.data]);

  // TODO: optimize here.
  // TODO: add the member Count.
  const { writeAsync: castVote } = useScaffoldContractWrite({
    contractName: "CommunityVerifier",
    functionName: "castVote",
    args: [0, false], // These will be updated when calling the function
  });

  const handleVote = async (proposalId: number, support: boolean) => {
    try {
      await castVote({
        args: [proposalId, support],
      });
      // Refresh proposals after voting
      // You might want to add a small delay here to allow the blockchain to update
      setTimeout(() => {
        votesReader.refetch();
      }, 5000);
    } catch (error) {
      console.error("Error casting vote:", error);
      alert("Failed to cast vote. Please try again.");
    }
  };

  // Helper function to determine the time part class
  function getTimePart(index: number): string {
    if (index < 2) return 'minutes tens';
    if (index < 4) return 'seconds tens';
    return 'hundredths tens';
  }

  const [randomColor, setRandomColor] = useState("");

  useEffect(() => {
    // Generate a random color when the component mounts
    setRandomColor(Math.floor(Math.random()*16777215).toString(16));
  }, []);

  return (
    <>
      <div>
        <div className="bg-base-100 p-6 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold text-center mb-4">🧑🧔‍♀️ Community Verifier 🧑🧔‍♀️</h1>

          {/* Add the new member check section */}
          <div className="mt-6">
            <center>
              <h2 className="text-xl font-semibold mb-2">IF Community Member🤔?</h2>

              <div className="flex items-center space-x-2 justify-center">
                <input
                  type="text"
                  placeholder="Enter address"
                  className="input input-bordered w-1/3"
                  value={memberAddress}
                  onChange={e => setMemberAddress(e.target.value)}
                />
              </div>
              {isMemberCheckLoading ? (
                <p className="mt-2">Checking membership...</p>
              ) : isMember !== undefined ? (
                <p className="mt-2">{isMember ? "✅ This address is a member" : "❌ This address is not a member"}</p>
              ) : null}

              <h2 className="text-xl font-semibold mb-2">I am a new member, let me join the community!</h2>
              <button
                className="btn btn-primary mt-2"
                onClick={() => createVote()}
                disabled={isCreatingVote || !address}
              >
                {isCreatingVote ? "Applying..." : "Apply to Join"}
              </button>
              {!address && (
                <p className="text-sm text-error mt-2">Please connect your wallet to apply.</p>
              )}
              <br></br>
              <br></br>
              <hr></hr>
              <br></br>
              <h2 className="text-xl font-semibold mb-4">
                Member Count
              </h2>
              {isMembersCountLoading ? (
                <p style={{ color: `#${randomColor}` }}>Loading member count...</p>
              ) : (
                <p className="digit" style={{ color: `#${randomColor}` }}>
                  {membersCount?.toString() || "0"}
                </p>
              )}
              <br></br>
              <br></br>
              <hr></hr>
              <div className="bg-base-100 p-6 rounded-lg shadow-xl mt-6">
                <h2 className="text-xl font-semibold mb-4">New Member Proposals</h2>
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Applicant</th>
                      <th>Deadline</th>
                      <th>AI Suggestion</th>
                      <th>Yes Votes</th>
                      <th>No Votes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {votes.map((vote) => (
                      <tr key={vote.id}>
                        <td>{vote.id}</td>
                        <td><Address address={vote.applicant} /></td>
                        <td>{vote.deadline}</td>
                        <td>{vote.aiSuggestion}</td>
                        <td>{vote.yesVotes}</td>
                        <td>{vote.noVotes}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-success mr-2"
                            onClick={() => handleVote(vote.id, true)}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-sm btn-error"
                            onClick={() => handleVote(vote.id, false)}
                          >
                            Deny
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </center>
          </div>
        </div>
      </div>
    </>
  );
};

export const getStaticProps = async () => {
  const filePathCn = path.join(process.cwd(), "public", "assets", "indiehacker-handbook-cn.md");
  const filePathEn = path.join(process.cwd(), "public", "assets", "indiehacker-handbook-en.md");
  const markdownContentCn = fs.readFileSync(filePathCn, "utf-8");
  const markdownContentEn = fs.readFileSync(filePathEn, "utf-8");

  // Function to process markdown content and get line positions
  const getLinePositions = (content: string) => {
    return content.split("\n").reduce((acc, line, index) => {
      acc.push({
        lineNumber: index + 1,
        position: acc[index - 1]?.position + 16 * 2 + 1 || 0,
        length: line.length,
      });
      return acc;
    }, [] as Array<{ lineNumber: number; position: number; length: number }>);
  };

  const linePositionsCn = getLinePositions(markdownContentCn);
  const linePositionsEn = getLinePositions(markdownContentEn);

  return {
    props: {
      markdownContentEn,
      markdownContentCn,
      linePositionsCn,
      linePositionsEn,
    },
  };
};

export default ETHSpace;
