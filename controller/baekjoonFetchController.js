const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const { marked } = require("marked"); // 최신 버전의 marked 모듈을 가져오는 방법

module.exports.baekjoonFetch = async (req, res) => {
  const problemNumber = req.query.number;

  console.log(`baekjoonFetch, number:${problemNumber}`);

  const url = `https://www.acmicpc.net/problem/${problemNumber}`;

  // Define the User-Agent
  const userAgent =
    req.headers["user-agent"] || "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

  axios
    .get(url, {
      headers: {
        "User-Agent": userAgent,
      },
    })
    .then((response) => {
      // Load the HTML data into cheerio
      const $ = cheerio.load(response.data);

      // Extract the problem title
      const problemTitle = $("#problem_title").text().trim();

      // Extract the specific values from the table
      const timeLimit = $("#problem-info tbody tr td").eq(0).text().trim();
      const memoryLimit = $("#problem-info tbody tr td").eq(1).text().trim();
      const submissions = $("#problem-info tbody tr td").eq(2).text().trim();
      const correctAnswers = $("#problem-info tbody tr td").eq(3).text().trim();
      const correctPeople = $("#problem-info tbody tr td").eq(4).text().trim();
      const correctRatio = $("#problem-info tbody tr td").eq(5).text().trim();

      // Extract the problem description
      // Initialize the description variable
      let description = "";

      // Iterate over all children of #problem_description
      $("#problem_description")
        .contents()
        .each((index, element) => {
          if (element.type === "text") {
            // Add text nodes
            description += $(element).text().trim() + "\n";
          } else if (element.name === "p") {
            // Process p tag and its children
            $(element)
              .contents()
              .each((i, child) => {
                if (child.type === "text") {
                  description += $(child).text().trim();
                } else if (child.name === "sup") {
                  // If sup tag, append with surrounding text
                  description += "^" + $(child).text().trim();
                } else if (child.name === "img") {
                  // Add image in the specific format
                  const imgUrl = $(child).attr("src");
                  description += `\n![img.png](${imgUrl})\n`;
                }
              });
            description += "\n"; // Add new line after processing the p tag
          } else if (element.name === "ul") {
            // Process ul tag and its li children
            $(element)
              .children("li")
              .each((i, li) => {
                let liText = "- ";
                $(li)
                  .contents()
                  .each((j, liChild) => {
                    if (liChild.type === "text") {
                      liText += $(liChild).text().trim();
                    } else if (liChild.name === "sup") {
                      liText += `^${$(liChild).text().trim()}`;
                    } else if (liChild.name === "img") {
                      const imgUrl = $(liChild).attr("src");
                      liText += `![img.png](${imgUrl})`;
                    }
                  });
                description += liText + "\n";
              });
          } else if (element.name === "img") {
            // Add image in the specific format
            const imgUrl = $(element).attr("src");
            description += `![img.png](${imgUrl})\n`;
          }
        });

      // Initialize the limit variable
      let limit = "";

      // Check if the limit section exists
      if ($("#limit").length > 0) {
        console.log("there is limit");
        $("#problem_limit li").each((index, element) => {
          let liText = "";

          // Iterate over the contents of the li to handle <sup> tags
          $(element)
            .contents()
            .each((i, child) => {
              if (child.type === "text") {
                liText += $(child).text().trim();
              } else if (child.name === "sup") {
                // Handle <sup> tags
                liText += `^${$(child).text().trim()}`;
              }
            });

          // Add the formatted li text to the limit variable
          limit += `- ${liText}\n`;
        });
      }

      // Extract the problem input
      const problemInput = $("#problem_input").text().trim();

      // Extract the problem output
      const problemOutput = $("#problem_output").text().trim();

      // // Extract the sample input text and wrap it with ```
      // const sampleInput = `\`\`\`\n${$("#sample-input-1").text().trim()}\n\`\`\``;

      // // Extract the sample output text and wrap it with ```
      // const sampleOutput = `\`\`\`\n${$("#sample-output-1").text().trim()}\n\`\`\``;

      // const cleanedSampleInput = sampleInput.replace(/`/g, "");
      // const cleanedSampleOutput = sampleOutput.replace(/`/g, "");

      // 모든 예제 입력 및 출력 추출
      let sampleCases = "";
      let samepleCasesForScript = "";
      $("section[id^=sampleinput]").each((i, inputElement) => {
        const inputId = $(inputElement).attr("id");
        const outputId = inputId.replace("input", "output");

        const inputText = $(`#${inputId} pre`).text().trim();
        const outputText = $(`#${outputId} pre`).text().trim();

        sampleCases += `
### 예제 입력 ${i + 1}
\`\`\`
${inputText}
\`\`\`

### 예제 출력 ${i + 1}
\`\`\`
${outputText}
\`\`\`
        `;

        samepleCasesForScript += `
### 예제 입력 ${i + 1}
\\\`\\\`\\\`
${inputText}
\\\`\\\`\\\`

### 예제 출력 ${i + 1}
\\\`\\\`\\\`
${outputText}
\\\`\\\`\\\``;
      });

      // markdown 콘텐츠 생성
      let markdown = `
# [${problemTitle}](https://www.acmicpc.net/problem/${problemNumber})

|시간 제한| 메모리 제한 |제출|정답|맞힌 사람|정답 비율|
|----|--------|----|----|----|----|
|${timeLimit}| ${memoryLimit} |${submissions}|${correctAnswers}|${correctPeople}|${correctRatio}|

## 문제
${description.trim()}

## 입력
${problemInput}

## 출력
${problemOutput}
`;

      if (limit) {
        markdown += `
## 제한
${limit.trim()}
`;
      }

      markdown += sampleCases;

      // Convert markdown to HTML
      const htmlContent = marked(markdown);

      // Send the HTML response
      res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BaekjoonToMD</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        }
        h1 {
            font-size: 2rem;
            margin-bottom: 20px;
        }
        .markdown-container {
            border: 2px solid #ddd;
            padding: 20px;
            width: 80%;
            max-width: 800px;
            background-color: #f9f9f9;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            position: relative;
        }
        pre {
            background-color: #f4f4f4;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: left;
        }
        th {
            background-color: #f4f4f4;
        }
        .button-group {
            position: absolute;
            top: 10px;
            right: 10px;
        }
        .copy-button {
            padding: 5px 10px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 5px;
        }
        .copy-button:hover {
            background-color: #45a049;
        }
        .download-button {
            padding: 5px 10px;
            background-color: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 5px;
        }
        .download-button:hover {
            background-color: #1976D2;
        }
        .home-button {
            padding: 5px 10px;
            background-color: #FF9800;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin-left: 5px;
        }
        .home-button:hover {
            background-color: #F57C00;
        }
        img {
        max-width: 80%;
        height: auto;
        display: block;
        margin: 0 auto;
    }
    </style>
</head>
<body>
    <h1>BaekJoon #${problemNumber} Converted to MD!</h1>
    <div class="markdown-container">
        <div class="button-group">
            <button class="copy-button" id="copy-button">Copy Markdown</button>
            <button class="download-button" id="download-button">Download MD</button>
            <button class="home-button" id="home-button">Home</button>
        </div>
        <div id="markdown-content">
            ${htmlContent}
        </div>
    </div>

    <script>
        document.addEventListener("DOMContentLoaded", function() {
            const markdown = \`
# [${problemTitle}](https://www.acmicpc.net/problem/${problemNumber})

|시간 제한| 메모리 제한 |제출|정답|맞힌 사람|정답 비율|
|----|--------|----|----|----|----|
|${timeLimit}| ${memoryLimit} |${submissions}|${correctAnswers}|${correctPeople}|${correctRatio}|

## 문제
${description.trim()}

## 입력
${problemInput}

## 출력
${problemOutput}

${limit ? `## 제한\n${limit.trim()}\n` : ""}


${samepleCasesForScript}

\`;

            document.getElementById("copy-button").addEventListener("click", function() {
                navigator.clipboard.writeText(markdown).then(() => {
                    alert('Markdown copied to clipboard!');
                }).catch(err => {
                    console.error('Failed to copy markdown: ', err);
                });
            });

            document.getElementById("home-button").addEventListener("click", function() {
                window.location.href = "/";
            });

            document.getElementById("download-button").addEventListener("click", function() {
                const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "README.md";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        });
    </script>
</body>
</html>
`);
    })
    .catch((error) => {
      console.error("Error fetching URL:", error.message);
      res.status(500).send(`An error occurred while fetching the problem: ${error.message}`);
    });
};
