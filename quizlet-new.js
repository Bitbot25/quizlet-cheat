async function requestQuizletInfo(itemId) {
 return await fetch("https://quizlet.com/" + itemId + "/");
}

async function requestQuizletItemId(gameCode) {
 let res = await fetch("https://quizlet.com/webapi/3.8/multiplayer/game-instance?gameCode=" + gameCode);
 let text = await res.text();
 console.log(text);
 let obj = JSON.parse(text);
 return obj.gameInstance.itemId;
}

async function accessTermIdToTermsMap(itemId) {
 console.log("Loading map");
 let res = await requestQuizletInfo(itemId);
 let res_text = await res.text();
 
 let split = res_text.split("<script");
 split = split[split.length - 6]
 split = split.split("/script>")[0];
 split = split.split("QLoad(")[0];
 split = split.split(`(function(){window.Quizlet["setPageData"] = `)[1];
 split = split.slice(0, -2);

 return JSON.parse(split).termIdToTermsMap;
}

async function constructDefinitionsAndTerms(terms, definitions, termIdToTerms) {
 const keys = Object.keys(termIdToTerms);
 for (let i = 0; i < keys.length; i++) {
  const key = keys[i];
  terms.push(termIdToTerms[key].word);
  definitions.push(termIdToTerms[key].definition);
 }
}

function getQuestionElem() {
 const element = $(".FormattedText.notranslate.StudentPrompt-text div");
 return element;
}

function getQuestion() {
 return getQuestionElem().text();
}

function answerCurrentQuestion(definitions, terms) {
 const question = getQuestion();
 const termIsQuestion = terms.includes(question);
 const index = termIsQuestion ? terms.indexOf(question) : definitions.indexOf(question);
 const answer = termIsQuestion ? definitions[index] : terms[index];
 
 const answerWidgets = $(".StudentAnswerOptions .StudentAnswerOptions-optionCard .FormattedText");

 let answerWidgetIndex = null;
 for (let j = 0; j < answerWidgets.length; j++) {
  if (answerWidgets[j].textContent === answer) {
   answerWidgetIndex = j;
   console.log(answerWidgetIndex);
   break;
  }
 }
 if (answerWidgetIndex === null) {
  console.log("Answer not found.")
 } else {
  const targetWidget = answerWidgets[answerWidgetIndex];
  targetWidget.click();
 }
}

async function runCheat(gameCode) {
 const itemId = await requestQuizletItemId(gameCode);
 const map = await accessTermIdToTermsMap(itemId);
 let defs = [];
 let terms = [];
 await constructDefinitionsAndTerms(terms, defs, map);

 registerListener(defs, terms);
}

function registerListener(defs, terms) {
 let lastText = null;
 const cfg = { attributes: true, childList: true, subtree: true };
 const callback = (mutationList, observer) => {
   const text = mutationList[0].target.innerText;
   if (text != lastText) {  
    console.log("diff");
    setTimeout(() => answerCurrentQuestion(defs, terms), 150)
   }
   lastText = text;
  }
 
 const observer = new MutationObserver(callback);
 observer.observe(getQuestionElem()["0"], cfg);
}
