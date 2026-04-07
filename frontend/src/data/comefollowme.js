/**
 * Come Follow Me weekly schedule with topic-specific questions.
 * Covers April–December. Weeks not in this list fall back to generic CFM questions.
 * Each week has exactly 4 questions tailored to that week's scriptures/topic.
 */

const CFM_SCHEDULE = [
  {
    startMonth: 4, startDay: 6,
    endMonth: 4, endDay: 12,
    topic: "Moses and Aaron before Pharaoh",
    scriptures: "Exodus 7–13",
    questions: [
      "What does Moses and Aaron standing before Pharaoh teach about courage when you're asked to speak truth to power?",
      "How do the plagues of Egypt show God's power over the false gods and systems of the world?",
      "What does the Passover symbolize about Jesus Christ and His Atonement?",
      "In what ways might I be like Pharaoh—hardening my heart to something God is asking of me?",
    ],
  },
  {
    startMonth: 4, startDay: 13,
    endMonth: 4, endDay: 19,
    topic: "The Red Sea",
    scriptures: "Exodus 14–18",
    questions: [
      "What does the parting of the Red Sea teach about trusting God when the path forward seems impossible?",
      "How did God provide for Israel's needs in the wilderness, and how does He provide for mine?",
      "What can Israel's murmuring teach me about my own response when trials stretch on longer than expected?",
      "What leadership lessons from Jethro's counsel to Moses apply to my life or calling right now?",
    ],
  },
  {
    startMonth: 4, startDay: 20,
    endMonth: 4, endDay: 26,
    topic: "The Ten Commandments",
    scriptures: "Exodus 19–20; 24; 31–34",
    questions: [
      "What does it mean to be a 'kingdom of priests and a holy nation' (Exodus 19:6) in today's world?",
      "How do the Ten Commandments apply to my daily life beyond their literal meaning?",
      "What does Moses interceding for Israel after the golden calf teach me about mercy and repentance?",
      "How do I respond spiritually when God asks me to wait—like Moses waiting on the mountain?",
    ],
  },
  {
    startMonth: 4, startDay: 27,
    endMonth: 5, endDay: 3,
    topic: "The Tabernacle and Sacrifice",
    scriptures: "Exodus 35–40; Leviticus 1; 4; 16; 19",
    questions: [
      "What does the building of the Tabernacle teach about consecration and giving God our best?",
      "How do the ancient sacrifices in Leviticus point forward to the Atonement of Jesus Christ?",
      "What does the Day of Atonement symbolize about cleansing, forgiveness, and access to God?",
      "How can 'love thy neighbor as thyself' (Leviticus 19:18) change how I treat someone specific this week?",
    ],
  },
  {
    startMonth: 5, startDay: 4,
    endMonth: 5, endDay: 10,
    topic: "Israel in the Wilderness",
    scriptures: "Numbers 11–14; 20–24; 27",
    questions: [
      "Why did Israel's lack of faith at the promised land cost them 40 years in the wilderness—and what does that say to me?",
      "How does Numbers 13–14 show the power of perspective: faithful vs. fearful reports of the same situation?",
      "What does Balaam's story teach about the tension between following God and seeking worldly reward?",
      "What is my personal 'promised land' right now, and what fear might be keeping me from it?",
    ],
  },
  {
    startMonth: 5, startDay: 11,
    endMonth: 5, endDay: 17,
    topic: "Moses's Final Teachings",
    scriptures: "Deuteronomy 6–8; 15; 18; 29–30; 34",
    questions: [
      "What does 'thou shalt love the LORD thy God with all thine heart' look like practically in my daily schedule?",
      "How does Deuteronomy 8 warn against the pride that can come with prosperity and success?",
      "What does Deuteronomy 30's promise—'if you return, God will gather you'—mean for someone who has drifted?",
      "What can I learn from Moses dying on Mount Nebo, faithfully finishing his mission without entering the promised land?",
    ],
  },
  {
    startMonth: 5, startDay: 18,
    endMonth: 5, endDay: 24,
    topic: "Joshua and the Promised Land",
    scriptures: "Joshua 1–8; 23–24",
    questions: [
      "What does 'be strong and courageous' (Joshua 1:9) mean for the specific challenge I'm facing right now?",
      "What can the fall of Jericho—walls coming down through obedience, not force—teach about how God works?",
      "How does Joshua's declaration, 'as for me and my house, we will serve the LORD,' apply to my family today?",
      "What does Achan's sin at Ai teach about how one person's hidden choices affect the whole community?",
    ],
  },
  {
    startMonth: 5, startDay: 25,
    endMonth: 5, endDay: 31,
    topic: "Judges: Deborah, Gideon, and Samson",
    scriptures: "Judges 2–4; 6–8; 13–16",
    questions: [
      "What is the 'cycle of apostasy' in Judges, and do I see that pattern in my own spiritual life?",
      "What does Deborah's leadership as judge and prophetess teach about women in God's work?",
      "How did Gideon overcome his own self-doubt to lead Israel, and what does that say to me about my own calling?",
      "What does Samson's story teach about the slow, gradual erosion of covenant commitments?",
    ],
  },
  {
    startMonth: 6, startDay: 1,
    endMonth: 6, endDay: 7,
    topic: "Ruth and Samuel",
    scriptures: "Ruth; 1 Samuel 1–7",
    questions: [
      "What does Ruth's loyalty to Naomi teach about staying with loved ones through hardship and loss?",
      "How did Hannah's prayer and her response to Eli model trust in God when prayers go unanswered for a long time?",
      "What can Samuel's childhood service in the temple teach about raising and nurturing faithful children?",
      "What does Israel losing the ark of the covenant reveal about their spiritual state—and what can I learn from that?",
    ],
  },
  {
    startMonth: 6, startDay: 8,
    endMonth: 6, endDay: 14,
    topic: "Saul and David",
    scriptures: "1 Samuel 8–10; 13; 15–16",
    questions: [
      "Why did Israel want a king like the other nations, and what does that reveal about the temptation to conform to the world?",
      "What does Saul's story teach about the danger of partial obedience—doing most of what God asks but not all?",
      "How does God's choice of David based on the heart (not outward appearance) challenge how I judge others or myself?",
      "What does 'to obey is better than sacrifice' (1 Samuel 15:22) look like in my discipleship right now?",
    ],
  },
  {
    startMonth: 6, startDay: 15,
    endMonth: 6, endDay: 21,
    topic: "David's Rise",
    scriptures: "1 Samuel 17–18; 24–26; 2 Samuel 5–7",
    questions: [
      "What does David facing Goliath teach about confronting impossible odds when you trust God more than your circumstances?",
      "How did David's restraint in not harming Saul—even when wronged—model respect for the Lord's anointed?",
      "What role did David's friendship with Jonathan play in his life, and what does it teach about loyal, covenant-level relationships?",
      "What does David's desire to build God a house teach about honoring the Lord with our best, even when our offer is declined?",
    ],
  },
  {
    startMonth: 6, startDay: 22,
    endMonth: 6, endDay: 28,
    topic: "David's Fall and Solomon's Wisdom",
    scriptures: "2 Samuel 11–12; 1 Kings 3; 6–9; 11",
    questions: [
      "What does David's fall with Bathsheba teach about the dangers of unchecked power and pride?",
      "How did Nathan use a parable to help David see his own sin—and how does God use stories to teach me?",
      "What does Solomon's request for wisdom—rather than wealth or power—teach about what I should be asking God for?",
      "What warning does Solomon's later apostasy give about the slow drift away from God that can happen even after great spiritual experiences?",
    ],
  },
  {
    startMonth: 6, startDay: 29,
    endMonth: 7, endDay: 5,
    topic: "Elijah and the Divided Kingdom",
    scriptures: "1 Kings 12–13; 17–22",
    questions: [
      "What can the division of Israel into two kingdoms teach about the consequences of pride and unwillingness to listen?",
      "How did Elijah's confrontation with the prophets of Baal on Mount Carmel demonstrate what it looks like to trust God completely?",
      "What does Elijah's experience with the still small voice teach about how God most often speaks to us?",
      "What can I learn from Elijah's burnout after Carmel, and God's gentle response of rest and restoration?",
    ],
  },
  {
    startMonth: 7, startDay: 6,
    endMonth: 7, endDay: 12,
    topic: "Elisha's Miracles",
    scriptures: "2 Kings 2–7",
    questions: [
      "What does Elisha's miracle with Naaman teach about overcoming pride to receive healing and blessings from God?",
      "How does the miracle of the widow's oil (2 Kings 4) speak to God's power to multiply what we consecrate to Him?",
      "What does 2 Kings 6:16—'those with us are more than those with them'—teach about seeing spiritual realities we can't always perceive?",
      "What does the translation of Elijah and the passing of his mantle to Elisha teach about prophetic succession?",
    ],
  },
  {
    startMonth: 7, startDay: 13,
    endMonth: 7, endDay: 19,
    topic: "The Fall of Israel and Judah",
    scriptures: "2 Kings 16–25",
    questions: [
      "What spiritual patterns led to the fall of both Israel and Judah, and do I see any of them in my own life?",
      "How did Hezekiah's prayer when surrounded by enemies model turning completely to God in crisis?",
      "What does Josiah's rediscovery of the scriptures—and his immediate, tearful repentance—teach about scripture's power?",
      "How can watching a nation slowly drift from God, generation by generation, inform how I think about spiritual continuity in my family?",
    ],
  },
  {
    startMonth: 7, startDay: 20,
    endMonth: 7, endDay: 26,
    topic: "Jehoshaphat, Uzziah, and Hezekiah",
    scriptures: "2 Chronicles 14–20; 26; 30",
    questions: [
      "What did King Jehoshaphat do when facing an overwhelming army (2 Chronicles 20), and how can I apply that response to my current problems?",
      "How does King Uzziah's pride and downfall after years of success warn me about my own strengths and accomplishments?",
      "What does Hezekiah's Passover revival teach about returning to God after a long period of collective spiritual wandering?",
      "What role did prophets play in guiding these kings, and how do modern prophets and apostles guide me?",
    ],
  },
  {
    startMonth: 7, startDay: 27,
    endMonth: 8, endDay: 2,
    topic: "Return from Exile: Ezra and Nehemiah",
    scriptures: "Ezra 1; 3–7; Nehemiah 2; 4–6; 8",
    questions: [
      "What does the return of Israel from Babylonian exile teach about second chances, restoration, and God's long memory of His covenants?",
      "How did Nehemiah lead the rebuilding of Jerusalem's walls despite constant mockery and opposition?",
      "What does Ezra's public reading of the scriptures—and the people's emotional response—teach about the power of God's word?",
      "How do I personally handle opposition when trying to do something God has asked me to do?",
    ],
  },
  {
    startMonth: 8, startDay: 3,
    endMonth: 8, endDay: 9,
    topic: "Esther",
    scriptures: "Esther",
    questions: [
      "What does Esther's courage teach about speaking up for what is right even when the personal cost is enormous?",
      "How does Mordecai's challenge—'who knoweth whether thou art come to the kingdom for such a time as this?'—apply to your life right now?",
      "What can I learn from Esther's preparation, fasting, and seeking support before approaching the king?",
      "How does the story of Esther show God working powerfully behind the scenes even when He is never mentioned by name?",
    ],
  },
  {
    startMonth: 8, startDay: 10,
    endMonth: 8, endDay: 16,
    topic: "Job",
    scriptures: "Job 1–3; 12–14; 19; 21–24; 38–40; 42",
    questions: [
      "What does Job's story teach about the relationship between trials and righteousness—does suffering always mean wrongdoing?",
      "How did Job maintain faith in God even when he didn't understand why he was suffering?",
      "What does 'I know that my Redeemer liveth' (Job 19:25) mean to you personally right now?",
      "What do God's questions to Job from the whirlwind teach about humility, perspective, and trust?",
    ],
  },
  {
    startMonth: 8, startDay: 17,
    endMonth: 8, endDay: 23,
    topic: "Psalms: The Lord Is My Shepherd",
    scriptures: "Psalms 1–2; 8; 19–33; 40; 46",
    questions: [
      "Which Psalm from this week speaks most to where you are right now in your life, and why?",
      "How does Psalm 23 change how you think about God's personal care and guidance in your life?",
      "What does Psalm 8's wonder at creation and human worth teach about how God sees you?",
      "How can you use the structure and honesty of the Psalms as a model for your own personal prayers?",
    ],
  },
  {
    startMonth: 8, startDay: 24,
    endMonth: 8, endDay: 30,
    topic: "Psalms: Praise and Repentance",
    scriptures: "Psalms 49–51; 61–66; 69–72; 77–78; 85–86",
    questions: [
      "How does David's prayer of repentance in Psalm 51 deepen your understanding of what true repentance looks like?",
      "What does Psalm 77's pattern—'I will remember the works of the Lord'—teach about dealing with doubt and spiritual dryness?",
      "How do the praise psalms (65–66) help shift your perspective when you are in the middle of a hard season?",
      "Which Psalm from this week would you share with someone going through grief or loss, and why?",
    ],
  },
  {
    startMonth: 8, startDay: 31,
    endMonth: 9, endDay: 6,
    topic: "Psalms: Praise Him",
    scriptures: "Psalms 102–3; 110; 116–19; 127–28; 135–39; 146–50",
    questions: [
      "How does Psalm 119's extended meditation on scripture inspire your own approach to studying the word of God?",
      "What does Psalm 127—'except the Lord build the house'—teach about where real success and security come from?",
      "How does Psalm 139's declaration that God knows you completely affect how you see your own worth?",
      "What does Psalm 150's all-encompassing call to praise God with everything we have teach about worship?",
    ],
  },
  {
    startMonth: 9, startDay: 7,
    endMonth: 9, endDay: 13,
    topic: "Proverbs and Ecclesiastes",
    scriptures: "Proverbs 1–4; 15–16; 22; 31; Ecclesiastes 1–3; 11–12",
    questions: [
      "How does 'trust in the Lord with all thine heart; and lean not unto thine own understanding' (Proverbs 3:5–6) guide a major decision you're facing?",
      "What does Proverbs teach about the relationship between wisdom, discipline, and daily choices?",
      "What does Ecclesiastes teach about finding meaning and purpose in a world where so much feels temporary?",
      "How does the description of a virtuous, capable woman in Proverbs 31 apply to both men and women in discipleship today?",
    ],
  },
  {
    startMonth: 9, startDay: 14,
    endMonth: 9, endDay: 20,
    topic: "Isaiah: Holy, Holy, Holy",
    scriptures: "Isaiah 1–12",
    questions: [
      "What does Isaiah's vision of God in the temple (Isaiah 6) teach about responding to God's holiness—and to a call to serve?",
      "How does Isaiah 1's invitation—'come, let us reason together'—reflect God's patience and willingness to work with imperfect people?",
      "What does Isaiah 9's prophecy of 'a great light' and 'a child is born' mean to you as a witness of Jesus Christ?",
      "How do Isaiah's warnings to ancient Israel speak to the world today—or to your personal life?",
    ],
  },
  {
    startMonth: 9, startDay: 21,
    endMonth: 9, endDay: 27,
    topic: "Isaiah: The Desert Shall Blossom",
    scriptures: "Isaiah 13–14; 22; 24–30; 35",
    questions: [
      "What does Isaiah 35's vision of the desert blossoming and streams in the wilderness teach about God's power to restore?",
      "How does Isaiah's warning against 'making Egypt my strength' (Isaiah 30–31) apply to trusting worldly sources of security over God?",
      "What does Isaiah 30:21—'this is the way, walk ye in it'—mean for the decisions you face right now?",
      "How does Isaiah's imagery of God as a potter shaping clay speak to your relationship with God and His role in your life?",
    ],
  },
  {
    startMonth: 9, startDay: 28,
    endMonth: 10, endDay: 4,
    topic: "Isaiah: Fear Not",
    scriptures: "Isaiah 40–49",
    questions: [
      "How does 'fear thou not; for I am with thee' (Isaiah 41:10) apply to something specific you are facing right now?",
      "What does Isaiah 43's 'I have redeemed thee, I have called thee by thy name; thou art mine' mean for your sense of identity?",
      "How does Isaiah 40's image of mounting up with eagle's wings speak to spiritual renewal when you feel worn down?",
      "What does God's challenge to idols in Isaiah 44–46 reveal about the false 'gods' we might place our trust in today?",
    ],
  },
  {
    startMonth: 10, startDay: 5,
    endMonth: 10, endDay: 11,
    topic: "Isaiah: The Suffering Servant",
    scriptures: "Isaiah 50–57",
    questions: [
      "How does the suffering servant passage (Isaiah 53) deepen your understanding of the Atonement of Jesus Christ?",
      "What does Isaiah 55's invitation—'Ho, every one that thirsteth, come ye to the waters'—say to someone who feels spiritually empty?",
      "How does Isaiah 54's imagery of God as a faithful, merciful husband to Israel speak to your covenant relationship with God?",
      "What does Isaiah 50:7—'I have set my face like a flint'—teach about commitment and endurance in your discipleship?",
    ],
  },
  {
    startMonth: 10, startDay: 12,
    endMonth: 10, endDay: 18,
    topic: "Isaiah: A New Creation",
    scriptures: "Isaiah 58–66",
    questions: [
      "What does the Lord's definition of the true fast in Isaiah 58 teach about the difference between outward religious performance and genuine discipleship?",
      "How does Isaiah 60's vision of light and Zion gathering speak to the global growth and mission of the Church today?",
      "What does Isaiah 61's 'good tidings to the meek' and 'the acceptable year of the Lord' mean—and how does it connect to Christ's mission?",
      "How does Isaiah 66's vision of a new creation give you hope for the future and for God's ultimate purposes?",
    ],
  },
  {
    startMonth: 10, startDay: 19,
    endMonth: 10, endDay: 25,
    topic: "Jeremiah: Called Before Birth",
    scriptures: "Jeremiah 1–3; 7; 16–18; 20",
    questions: [
      "What does Jeremiah's call as a young prophet teach about God using ordinary people for extraordinary work?",
      "How does 'before I formed thee in the belly I knew thee' (Jeremiah 1:5) affect your understanding of your own premortal identity and purpose?",
      "What does Jeremiah 18's imagery of the potter and clay teach about God's ability and willingness to reshape us?",
      "How did Jeremiah stay faithful when his message was rejected and he was persecuted—and what can I learn from that?",
    ],
  },
  {
    startMonth: 10, startDay: 26,
    endMonth: 11, endDay: 1,
    topic: "Jeremiah: A New Covenant",
    scriptures: "Jeremiah 31–33; 36–38; Lamentations 1; 3",
    questions: [
      "What does the 'new covenant' God promises in Jeremiah 31 foreshadow about the gospel and Atonement of Jesus Christ?",
      "How did Jeremiah respond when his writings were burned by the king—and what does that resilience teach about standing by truth?",
      "How does Lamentations 3's 'great is thy faithfulness' emerge from the depths of grief? What does that teach about hope in darkness?",
      "What does Jeremiah's imprisonment while still prophesying teach about maintaining integrity when obedience comes at a cost?",
    ],
  },
  {
    startMonth: 11, startDay: 2,
    endMonth: 11, endDay: 8,
    topic: "Ezekiel: Watchman and Shepherd",
    scriptures: "Ezekiel 1–3; 33–34; 36–37; 47",
    questions: [
      "What does Ezekiel's vision of the valley of dry bones teach about the Resurrection and God's power to bring spiritual renewal?",
      "How does God's description of Himself as the Good Shepherd (Ezekiel 34) compare to Jesus's own words in the New Testament?",
      "What does the role of a watchman (Ezekiel 33) teach about personal responsibility to warn, testify, and speak truth?",
      "How does the river flowing from the temple in Ezekiel 47 speak to the life-giving, healing power of the gospel?",
    ],
  },
  {
    startMonth: 11, startDay: 9,
    endMonth: 11, endDay: 15,
    topic: "Daniel: Steadfast in Faith",
    scriptures: "Daniel 1–7",
    questions: [
      "What did Daniel and his friends demonstrate when they chose not to eat the king's food—and how do I apply that kind of quiet integrity?",
      "How does the story of Shadrach, Meshach, and Abednego teach about faith even when God doesn't promise to deliver you from the trial?",
      "What does Daniel's interpretation of Nebuchadnezzar's dream—the stone cut without hands—teach about the kingdom of God rolling forth?",
      "How did Daniel maintain his prayer life even when it was made illegal, and what does that teach me about my own priorities?",
    ],
  },
  {
    startMonth: 11, startDay: 16,
    endMonth: 11, endDay: 22,
    topic: "Hosea and Joel: Return to the Lord",
    scriptures: "Hosea 1–6; 10–14; Joel",
    questions: [
      "What does Hosea's marriage to Gomer teach about God's relentless, covenant love for Israel—and for us?",
      "How does 'I will heal their backsliding, I will love them freely' (Hosea 14:4) speak to God's mercy after repentance?",
      "What does Joel's call to 'rend your heart, and not your garments' teach about sincere versus performative repentance?",
      "How does Joel's prophecy about God pouring out His Spirit on all flesh (Joel 2) connect to the Restoration and our day?",
    ],
  },
  {
    startMonth: 11, startDay: 23,
    endMonth: 11, endDay: 29,
    topic: "Amos, Obadiah, and Jonah",
    scriptures: "Amos; Obadiah; Jonah",
    questions: [
      "What does Amos's warning about social injustice and mistreating the poor teach about our covenant responsibility to others?",
      "How does Jonah's flight from God's call—and his time in the whale—relate to moments in my life when I've resisted what God has asked?",
      "What does God's compassion on Nineveh—even when Jonah was angry about it—teach about the full scope of God's love?",
      "How do these minor prophets together speak to the importance of individual repentance and God's patience with all people?",
    ],
  },
  {
    startMonth: 11, startDay: 30,
    endMonth: 12, endDay: 6,
    topic: "Micah, Nahum, Habakkuk, and Zephaniah",
    scriptures: "Micah; Nahum; Habakkuk; Zephaniah",
    questions: [
      "What does 'what doth the Lord require of thee, but to do justly, and to love mercy, and to walk humbly' (Micah 6:8) mean in my daily life this week?",
      "How does Habakkuk's question—'Why do you let evil prosper?'—resonate with questions I've had about God's justice?",
      "What does Habakkuk 3:17–18's trust in God even when everything fails teach about faith that doesn't depend on circumstances?",
      "How do Micah's prophecies of the Messiah born in Bethlehem strengthen your personal testimony of Jesus Christ?",
    ],
  },
  {
    startMonth: 12, startDay: 7,
    endMonth: 12, endDay: 13,
    topic: "Haggai and Zechariah: Not by Might",
    scriptures: "Haggai 1–2; Zechariah 1–4; 7–14",
    questions: [
      "What does Haggai's call to rebuild the temple teach about spiritual priorities—is God's house a priority while I run after my own things?",
      "How does Zechariah's vision of Joshua the high priest being cleansed of filthy garments speak to the Atonement and our own standing before God?",
      "What does 'not by might, nor by power, but by my spirit, saith the Lord' (Zechariah 4:6) mean for how I try to accomplish God's work?",
      "How do Zechariah's prophecies of a king entering Jerusalem on a donkey connect to Jesus's triumphal entry and His role as the promised Messiah?",
    ],
  },
  {
    startMonth: 12, startDay: 14,
    endMonth: 12, endDay: 20,
    topic: "Malachi: Return unto Me",
    scriptures: "Malachi",
    questions: [
      "What does Malachi's question—'will a man rob God?'—and God's promise to open the windows of heaven teach about tithing and sacrifice?",
      "How does Malachi's prophecy of Elijah returning before the great day of the Lord connect to the Restoration and temple work today?",
      "What does 'return unto me, and I will return unto you' (Malachi 3:7) mean for someone who feels distant from God right now?",
      "How does Malachi close the Old Testament, and what hope does it hold out for the coming of Christ?",
    ],
  },
  {
    startMonth: 12, startDay: 21,
    endMonth: 12, endDay: 27,
    topic: "Christmas",
    scriptures: "Luke 2; Matthew 2",
    questions: [
      "How do the Old Testament prophecies—Isaiah 7:14, 9:6, Micah 5:2—deepen your appreciation of Christ's birth as you celebrate Christmas?",
      "What aspect of the Nativity story means the most to you this Christmas, and why?",
      "How does the entire Old Testament journey—from Creation to Malachi—point toward and prepare the world for Jesus Christ?",
      "What is one insight from this year's Come Follow Me study that you want to carry with you into the new year?",
    ],
  },
];

/**
 * Returns 4 questions for the current week's Come Follow Me lesson.
 * Falls back to null if today's date doesn't match any week in the schedule.
 */
export function getCurrentCFMQuestions() {
  const now = new Date();
  const current = (now.getMonth() + 1) * 100 + now.getDate();

  for (const week of CFM_SCHEDULE) {
    const start = week.startMonth * 100 + week.startDay;
    const end = week.endMonth * 100 + week.endDay;
    if (current >= start && current <= end) {
      return week.questions;
    }
  }

  return null;
}

export default CFM_SCHEDULE;
