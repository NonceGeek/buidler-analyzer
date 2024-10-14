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

  const [newNoteContent, setNewNoteContent] = useState("");

  const { address } = useAccount();
  const { data: commentCount } = useScaffoldContractRead({
    contractName: "CommunityVerifier",
    functionName: "commentCount",
  });
  const commentsReader = useCommentsReader(commentCount);

  const { writeAsync: addCommentOnChain, isLoading: isAddingCommentOnChain } = useScaffoldContractWrite({
    contractName: "CommunityVerifier",
    functionName: "addComment",
    args: [selectedLine, newNoteWord, newNoteContent, Math.floor(Date.now() / 1000).toString()],
    onSuccess: () => {
      console.log("Comment added on-chain successfully");
      setNewNoteWord("");
      setNewNoteContent("");
      fetchNotes();
    },
  });

  const [githubUsername, setGithubUsername] = useState("leeduckgo");
  const [analyzerData, setAnalyzerData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const fetchNotes = async () => {
    try {
      const response = await fetch("https://indiehacker.deno.dev/notes");
      const data = await response.json();
      setNotes(data);
      setNotesLines(new Set(data.filter((note: Note) => note.version === language).map((note: Note) => note.line)));
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };
  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    if (commentsReader.data) {
      const onChainNotes = commentsReader.data.map((comment: any) => ({
        id: `onchain-${comment.result[1]}-${comment.result[2]}`,
        line: Number(comment.result[1]),
        word: comment.result[2],
        note: comment.result[3],
        author: comment.result[0],
        created_at: new Date().toISOString(),
        version: language, // Use the current language state
        onchain: true,
      }));

      const combinedList = [...notes, ...onChainNotes];
      setCombinedNotes(combinedList);

      const newCombinedNotesLines = new Set([...Array.from(notesLines), ...onChainNotes.map(note => note.line)]);
      setCombinedNotesLines(newCombinedNotesLines);

      console.log("onChainNotes", onChainNotes);
      console.log("combinedList", combinedList);
      console.log("combinedNotes", combinedList); // Use combinedList instead of combinedNotes state
    } else {
      console.log("no commentsReader.data");
      setCombinedNotes(notes);
      setCombinedNotesLines(new Set(notesLines));
    }
  }, [commentsReader.data, notes, notesLines, language]);

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

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleExpandRight = () => {
    setIsExpandedRight(prev => !prev);
  };

  const toggleLanguage = (lang: "en" | "cn") => {
    setLanguage(lang);
    router.push({ query: { ...router.query, lang } }, undefined, { shallow: true });
  };

  const handleLineClick = (lineNumber: number, event: React.MouseEvent) => {
    console.log("lineNumber", lineNumber);
    console.log("event", event);
    // TODO: very strange here.
    // This codes no work: toggleExpandRight
    toggleExpandRight();
    // setIsExpandedRight(true);
    setSelectedLine(lineNumber);
    setUrlLine(lineNumber);
    router.push(`?line=${lineNumber}`, undefined, { shallow: true });
    const viewportTopY = window.scrollY; // 获取当前滚动位置的 Y 坐标
    setClickPosition({ x: event.clientX, y: viewportTopY + 100 });
  };

  useEffect(() => {
    const markdownContainer = markdownRef.current;
    if (markdownContainer) {
      const elements = markdownContainer.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li");
      elements.forEach((element, index) => {
        const lineNumber = index + 1;
        if (combinedNotesLines.has(lineNumber)) {
          // TODO: use the blue underline instead of bg-yellow-100, not spec background color.
          element.style.textDecoration = "underline";
          element.style.textDecorationStyle = "dotted";
        } else {
          element.style.textDecoration = "none";
          // Remove highlight if not in notesLines
        }
      });

      const handleClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (target.tagName.match(/H[1-6]|P|LI/)) {
          const lineNumber =
            Array.from(markdownContainer.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li")).indexOf(target) + 1;

          handleLineClick(lineNumber, event);
        }
      };

      markdownContainer.addEventListener("click", handleClick);

      return () => {
        markdownContainer.removeEventListener("click", handleClick);
      };
    }
  }, [language, notesLines]); // Add notesLines to the dependency array

  const handleSubmitNote = async () => {
    if (!selectedLine || !newNoteWord || !newNoteContent) return;

    if (!address) {
      alert("Please connect your wallet to submit a note.");
      return;
    }

    try {
      const response = await fetch("https://indiehacker.deno.dev/add_notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          line: selectedLine,
          word: newNoteWord,
          note: newNoteContent,
          version: language,
          author: address,
        }),
      });

      if (response.ok) {
        // Clear input fields and refresh notes
        setNewNoteWord("");
        setNewNoteContent("");
        await fetchNotes(); // Refresh notes after successful submission
      } else {
        console.error("Failed to submit note");
      }
    } catch (error) {
      console.error("Error submitting note:", error);
    }
  };

  const handleSubmitNoteOnChain = async () => {
    if (!selectedLine || !newNoteWord || !newNoteContent) {
      alert("Please fill in all fields before submitting the note on-chain.");
      return;
    }

    if (!address) {
      alert("Please connect your wallet to submit a note on-chain.");
      return;
    }

    try {
      await addCommentOnChain();
    } catch (error) {
      console.error("Error submitting note on-chain:", error);
      alert("Failed to submit note on-chain. Please try again.");
    }
  };

  const renderNoteBox = () => {
    if (!isExpandedRight || selectedLine === null) return null;

    return (
      <div className="card bg-base-100 shadow-xl m-2 p-4">
        <h3 className="text-lg font-semibold mb-2">Add a new note</h3>
        <input
          type="text"
          placeholder="Word or phrase"
          className="input input-bordered w-full mb-2 rounded-none"
          value={newNoteWord}
          onChange={e => setNewNoteWord(e.target.value)}
        />
        <textarea
          placeholder="Your note"
          className="textarea textarea-bordered w-full mb-2 rounded-none"
          value={newNoteContent}
          onChange={e => setNewNoteContent(e.target.value)}
        />
        <button onClick={handleSubmitNote} className="btn btn-primary mb-2">
          Submit Note
        </button>
        <button onClick={handleSubmitNoteOnChain} className="btn btn-primary" disabled={isAddingCommentOnChain}>
          {isAddingCommentOnChain ? "Submitting..." : "Submit Note On Chain"}
        </button>
      </div>
    );
  };

  

  return (
    <>
      <div>
        <div className="bg-base-100 p-6 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold text-center mb-4">Buidler Smart Analyzer</h1>
          <div className="flex items-center justify-center space-x-2">
            <input
              type="text"
              placeholder="Enter GitHub username"
              className="input input-bordered w-full max-w-xs"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
            />
            <button
              className={`btn btn-primary ${isAnalyzing ? 'loading' : ''}`}
              onClick={analyzeGithubUser}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? '🤖 Analyzing...' : '🤖 Analyze'}
            </button>
          </div>
          
          {analyzerData && (
            <center>
              <div className="mt-4">
                <table className="table-auto border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2">Criteria</th>
                      <th className="border border-gray-300 px-4 py-2">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Followers > ☝️</td>
                      <td className="border border-gray-300 px-4 py-2">{analyzerData.analysis.followersBiggerThanOne === "Yes" ? "✅" : "❌"}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Has Sourced & Public Repos More than 🤟</td>
                      <td className="border border-gray-300 px-4 py-2">{analyzerData.analysis.sourcePublicRepos === "Yes" ? "✅" : "❌"}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Has Social Accounts 🔗</td>
                      <td className="border border-gray-300 px-4 py-2">{analyzerData.analysis.hasSocialAccounts === "Yes" ? "✅" : "❌"}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Has Public Email ✉️</td>
                      <td className="border border-gray-300 px-4 py-2">{analyzerData.analysis.hasPublicEmail === "Yes" ? "✅" : "❌"}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Active in Last Month 🕒</td>
                      <td className="border border-gray-300 px-4 py-2">{analyzerData.analysis.lastCommitInLastMonth === "Yes" ? "✅" : "❌"}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="mt-4 font-semibold">
                  {Object.entries(analyzerData.analysis).filter(([key]) => key !== 'hasPublicEmail').every(([_, value]) => value === "Yes")
                    ? "I think...this user is a real BUIDLER! ฅ≽^•⩊•^≼ฅ"
                    : "Maybe...this user is not a real buidler TAT."}
                </p>
              </div>
            </center>
          )}
          
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