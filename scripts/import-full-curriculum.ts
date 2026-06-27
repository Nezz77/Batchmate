import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Extracted OCR Texts
const aiText = `
Level 1 - Semester I
CM 1210 Introduction to Intelligent Machines C 2 - 2
CM 1220 Fundamentals of Machines C 1 2 2
CM 1230 Foundations of Artificial Intelligence C 2 - 2
IN 1331 Microcontroller Based System Design C 2 2 3
IN 1321 Computer Organization C 2 1 2.5
IN 1101 Programming Fundamentals C 3 2 4
IS 1011 English (NGPA) C 2 2 3
CM 1900 Intelligent Machines Inspirational Project C 2.5
Level 1 - Semester II
CM 1410 Probability and Statistics C 2 2 3
CM 1310 Linear Algebra and Calculus C 2 2 3
IN 1401 Fundamentals of Databases C 2 1 2.5
IN 1111 Data Structures and Algorithms I C 2 1 2.5
IN 1501 Data Communication C 2 1 2.5
IN 1621 Web Technologies C 2 2 3
Level 2 - Semester I
CM 2510 Modern Approach to Artificial Intelligence C 2 1 2.5
IN 2311 Operating Systems C 2 1 2.5
IN 2211 Object-oriented Analysis and Design C 2 1 2.5
IN 2201 Software Engineering C 2 1 2.5
IN 2101 Object-Oriented Programming C 2 2 3
IS 1101 Principles of Management C 2 1 2.5
CM 2900 Industry Based AI Software Project C 3
Level 2 - Semester II
CM 2420 Statistical Inference C 2 2 3
CM 2320 Mathematical Methods C 2 1 2.5
CM 2520 Deductive Reasoning and Logic Programming C 2 1 2.5
IN 2111 Data Structures and Algorithms II C 2 1 2.5
IN 2511 Computer Networks C 2 1 2.5
IN 2601 Computer Graphics C 2 2 3
IN 2401 Database Management Systems C 2 2 3
Level 3 - Semester I
CM 3610 Expert Systems C 2 1 2.5
CM 3230 Automata Theory C 2 1 2.5
CM 3710 Artificial Neural Networks C 2 1 2.5
CM 3720 Machine Learning C 2 1 2.5
CM 3810 Fuzzy Logic C 2 1 2.5
CM 3630 Multi Agent System C 2 1 2.5
IN 2321 Computer Architecture C 2 1 2.5
IS 3700 IT Project Management C 2 1 2.5
CM 3130 Operations Research E 2 1 2.5
CM 3640 Artificial Cognitive Systems E 2 1 2.5
CM 3430 Computational Statistics E 2 1 2.5
CM 3340 Numerical Analysis E 2 1 2.5
IN 3101 Enterprise Application Development E 2 1 2.5
CM 3000 Industrial Training (NGPA) C 24 Weeks 6
Level 3-Semester II
CM 3900 Independent Study in AI (NGPA) C 2 - 2
CM 3530 Research Methods C 2 1 2.5
CM 3620 Natural Language Processing C 2 1 2.5
CM 3820 Evolutionary Computing C 2 1 2.5
IS 4430 Social Aspect of IT C 2 1 2.5
CM 3250 Fundamentals of Visual Communication Design E 2 1 2.5
CM 3540 Bioinformatics E 2 1 2.5
CM 3830 Rough Set Theory E 2 1 2.5
IS 2200 Principles of Marketing and Consumer Solutions E 2 1 2.5
IN 3410 Data Mining and Data Warehousing E 2 1 2.5
Level 4 – Semester I
CM 4650 Semantic Web & Ontological Modelling C 2 1 2.5
CM 4730 Deep Learning C 2 1 2.5
CM 4150 Recommender Systems C 2 1 2.5
CM 4260 Machine Translations E 2 1 2.5
CM 4560 Philosophy of Science (NGPA) C 2 - 2
IN 4630 Game Theory E 2 1 2.5
CM 4690 Introduction to Agent-based Modelling E 2 1 2.5
CM 4280 Theory of Compilers E 2 1 2.5
CM 4240 Robotics E 2 1 2.5
CM 4460 Time Series Analysis & Forecasting E 2 1 2.5
CM 4180 Mathematical Modelling E 2 1 2.5
IN 4621 Digital Image Processing E 2 1 2.5
IN 4721 Geographic Information Systems E 2 1 2.5
IN 4521 High Speed Communication Networks E 2 1 2.5
IN 4411 Big Data Analytics E 2 1 2.5
CM 4660 Speech Processing E 2 1 2.5
IN 4640 Machine Vision E 2 1 2.5
IS 3610 Management Information Systems E 2 1 2.5
CM 4900 Research Project in AI C 10
Level 4 - Semester II
CM 4670 Quantum Computing E 2 1 2.5
CM 4290 Swarm Intelligence E 2 1 2.5
CM 4170 Abstract Algebraic Structures E 2 1 2.5
CM 4450 Computational Bayesian Statistics E 2 1 2.5
CM 4440 Advanced Statistical Modelling E 2 1 2.5
CM 4680 Neuroscience for Artificial Intelligence E 2 1 2.5
CM 4740 Deep Reinforcement Learning E 2 1 2.5
CM 4550 Distributed Computing for AI E 2 1 2.5
CM 4250 Affective Computing E 2 1 2.5
CM 4270 Theory of Computability and Complexity E 2 1 2.5
IS 4600 IT Quality Assurance C 2 1 2.5
IS 3450 Business and Entrepreneurship (NGPA) C 2 1 2.5
IS 3020 Human Communication and Language Structures E 2 1 2.5
IN 4550 Cyber Security E 2 1 2.5
IN 4770 Cloud Computing E 2 1 2.5
`

const itmText = `
Semester 1
IN 1120 Structured Programming I C 2 1 2.5 30 70
IN 1301 Digital Systems and Digital Computers C 2 2 3.0 40 60
IN 1601 Multimedia Technologies and Web Design C 2 2 3.0 30 70
IS 1901 Microcontroller based ICT Project C 3.0 100
IS 1101 Principles of Management C 2 1 2.5 30 70
CM 1121 Essentials of Mathematics C 2 1 2.5 30 70
IS 1011 English C 2 2 3.0 50 50
Semester 2
IN 1130 Structured Programming II C 2 1 2.5 30 70
IN 1401 Fundamentals of Databases C 2 1 2.5 30 70
IS 1110 Business Foundation C 2 1 2.5 30 70
IS 1910 Industry Reconnaissance and Engagement C 1 2 2.0 100
CM 1131 Elements of Probability and Statistics C 2 1 2.5 30 70
Semester 3
IN 2110 Fundamentals of Object Oriented Programming C 2 2 3 40 60
IN 2120 Web Programming C 2 1 2.5 30 70
IN 2201 Software Engineering C 2 2 3 30 70
IS 2901 Software Development Project C 4 100
IN 2211 Object Oriented Analysis and Design C 2 1 2.5 30 70
IS 2200 Principles of Marketing & Consumer Solutions C 2 1 2.5 40 60
IS 2240 Fundamentals of Accounting and Finance C 2 1 2.5 30 70
CM 2121 Foundation of Mathematical Methods C 2 1 2.5 30 70
Semester 4
IN 2610 Graphic Design and Development C 2 1 2.5 30 70
IN 2410 Database Systems C 2 1 2.5 30 70
IN 2301 Essentials of Computer Organization & Architecture C 2 1 2.5 30 70
IN 2121 Data Structures and Algorithms I C 2 1 2.5 30 70
IS 2310 Essentials of Business Law and Taxation C 1 2 2 30 70
IS 2230 Economic Applications in Business C 2 1 2.5 30 70
CM 2111 Statistical Inference C 2 1 2.5 30 70
Semester 5
IN 3311 Operating Systems C 2 1 2.5 30 70
IN 3530 Data Communication & Computer Networks C 2 1 2.5 30 70
CM 3311 Artificial Intelligence C 2 1 2.5 40 60
CM 3211 Automata Theory C 2 1 2.5 30 70
IS 3610 Management Information Systems C 2 1 2.5 30 70
IS 3920 Individual Project on Business Solutions C 2.5 100
IS 3700 IT Project Management C 2 1 2.5 40 60
IS 3011 Communication Skills and Professional Conduct C 1 2 2.0 100
IN 3700 Human Computer Interaction E 2 1 2.5 40 60
IN 3101 Enterprise Application Development E 2 1 2.5 40 60
IN 3320 Embedded Systems E 2 1 2.5 40 60
IN 3210 Mobile Applications Development E 2 1 2.5 30 70
IS 3130 Strategic Management E 2 1 2.5 40 60
IS 3020 Human Communication and Language Structures E 2 1 2.5 40 60
IS 3120 Organizational Behaviour E 2 1 2.5 40 60
IS 3200 Digital Business Management E 2 1 2.5 50 50
IS 3300 Management Accounting E 2 1 2.5 30 70
IS 3510 Fundamentals of Behavioural Genetics E 2 1 2.5 30 70
IS 3520 Fundamentals of Behavioural Science E 2 1 2.5 40 60
IS 3720 Supply Chain Management E 2 1 2.5 30 70
IS 3730 Talent Management E 2 1 2.5 40 60
Semester 6
IS 3001 Scientific Communication C 2 1 2.5 40 60
IS 3500 Research Methodology C 1 2 2 100
IS 3540 Cognitive Psychology of Consumer Decisions E 2 1 2.5 40 60
IS 3320 Financial Analysis and Management E 2 1 2.5 30 70
CM 3321 Logic Programming & Artificial Cognitive Systems E 2 1 2.5 40 60
IN 3410 Data Mining and Data Warehousing E 2 1 2.5 30 70
IS 4430 Social Aspects of IT E 2 1 2.5 40 60
IS 4480 International Business E 2 1 2.5 30 70
Semester 7
IS 4650 Software Management C 2 1 2.5 40 60
IS 4600 IT Quality Assurance C 2 1 2.5 40 60
IS 4440 Professional Practice C 2 1 2.5 40 60
IS 4660 Corporate Information Security Management C 2 1 2.5 50 50
IS 4990 Comprehensive Group Project C 10.0 100
IN 4740 UI/UX Engineering E 2 1 2.5 50 50
IN 4560 Information Security E 2 1 2.5 30 70
IN 4770 Cloud Computing E 2 1 2.5 30 70
IN 4750 Ubiquitous and Wearable Computing E 2 1 2.5 30 70
IN 4440 Advanced Database Management Systems E 2 1 2.5 40 60
IN 4531 Multimedia Communications E 2 1 2.5 30 70
IN 4721 Geographic Information Systems E 2 1 2.5 40 60
IN 4220 Software Architecture and Design Patterns E 2 1 2.5 40 60
IN 4601 Multimedia Systems E 2 1 2.5 30 70
IN 4760 Location-Based Services and Systems E 2 1 2.5 40 60
IN 4430 Digital Resource Archiving & Information Retrieval E 2 1 2.5 30 70
IN 4411 Big Data Analytics E 2 1 2.5 40 60
IN 4320 Internet of Things E 2 1 2.5 40 60
IN 4101 Theory of Programming Languages E 2 1 2.5 30 70
IN 4701 Distributed Systems and Cluster Computing E 2 1 2.5 30 70
CM 3111 Computational Methods E 2 1 2.5 30 70
CM 3121 Statistical Computing E 2 1 2.5 30 70
CM 3331 Fundamentals of Bioinformatics E 2 1 2.5 30 70
CM 4111 Introduction to Numerical Optimization E 2 1 2.5 30 70
CM 4161 Advanced Topics in Statistics E 2 1 2.5 30 70
CM 4211 Theory of Computability & Complexity E 2 1 2.5 40 60
CM 4221 Theory of Compilers E 2 1 2.5 40 60
CM 4311 Artificial Neural Networks & Evolutionary Computing E 2 1 2.5 30 70
CM 4321 Complex Systems and Agent Technology E 2 1 2.5 40 60
CM 4331 Semantic Web and Ontological Modelling E 2 1 2.5 30 70
CM 4341 Natural Language Processing E 2 1 2.5 30 70
CM 4351 Fuzzy Logic E 2 1 2.5 30 70
CM 4361 Robotics E 2 1 2.5 30 70
CM 4371 Machine Learning and Pattern Recognition E 2 1 2.5 30 70
CM 4381 Deep Learning Architectures E 2 1 2.5 30 70
CM 4391 Advanced Bioinformatics E 2 1 2.5 30 70
CM 4231 Formal Methods and Software Verification E 2 1 2.5 30 70
CM 4411 Reinforcement Learning E 2 1 2.5 30 70
CM 4141 Operational Research E 2 1 2.5 40 60
IS 4620 Information Systems Management E 2 1 2.5 30 70
IS 4720 Management of Sensitive Projects E 2 1 2.5 40 60
IS 4630 Cloud Infrastructure Management E 2 1 2.5 50 50
IS 4640 Knowledge Representation and Management E 2 1 2.5 40 60
IS 4460 Social Entrepreneurship E 2 1 2.5 40 60
IS 4000 Educational Technology E 2 1 2.5 40 60
IS 4470 Business Intelligence E 2 1 2.5 40 60
IS 3410 Forensic Accounting and Fraud Investigations E 2 1 2.5 30 70
IS 4100 Corporate Governance and Social Responsibility E 2 1 2.5 40 60
IS 4350 Financial Engineering E 2 1 2.5 30 70
IS 4500 Advanced Topics in Behavioural Genetics E 2 1 2.5 30 70
IS 4530 Applied Behavioural Science E 2 1 2.5 30 70
IS 3310 Accounting Information Systems E 2 1 2.5 30 70
IS 4490 Information Technology Law E 2 1 2.5 30 70
IS 4730 Management Science E 2 1 2.5 40 60
IS 4360 Risk and Portfolio Management E 2 1 2.5 30 70
IS 4110 Business Scenario Planning E 2 1 2.5 40 60
IS 4120 Business Change and Process Management E 2 1 2.5 30 70
IS 3210 Consumer Solutions Designing and Management E 2 1 2.5 40 60
IS 4220 Marketing Management E 2 1 2.5 40 60
IS 4240 Product Management E 2 1 2.5 40 60
IS 4520 Applied Market Research Methods E 2 1 2.5 40 60
IS 4250 Business Architecture Modelling E 2 1 2.5 40 60
`

const itText = `
Semester 1
CM 1111 Fundamentals of Mathematics C 2 1 2.5 30 70
IN 1311 Digital System Design C 2 2 3 40 60
IN 1101 Programming Fundamentals C 3 2 4 30 70
IN 1321 Computer Organization C 2 1 2.5 30 70
IN 1611 Multimedia Technologies C 2 1 2.5 30 70
IN 1901 Microcontroller Based Application Development Project C 4 100 0
IS 1011 English C 2 2 3 50 50
Semester 2
CM 1131 Elements of Probability and Statistics C 2 1 2.5 30 70
IN 1401 Fundamentals of Databases C 2 1 2.5 30 70
IN 1501 Data Communication C 2 1 2.5 30 70
IN 1111 Data Structures and Algorithms 1 C 2 1 2.5 30 70
IN 1621 Web Technologies C 2 2 3 30 70
IS 1101 Principles of Management C 2 1 2.5 30 70
Semester 3
CM 2131 Essentials of Mathematical Methods C 2 1 2.5 30 70
IN 2101 Object Oriented Programming C 2 2 3 40 60
IN 2211 Object-Oriented Analysis and Design C 2 1 2.5 30 70
IN 2201 Software Engineering C 2 2 3 30 70
IN 2321 Computer Architecture C 2 1 2.5 30 70
IN 2311 Operating System C 2 1 2.5 40 60
IN 2901 Software Development Project C 4 100 0
Semester 4
CM 2111 Statistical Inference C 2 1 2.5 30 70
IN 2601 Computer Graphics C 2 2 3 30 70
IN 2111 Data Structures and Algorithms II C 2 1 2.5 30 70
IN 2511 Computer Networks C 2 1 2.5 30 70
IN 2401 Database Management Systems C 2 2 3 30 70
IS 2211 Fundamentals of Business Economics C 2 1 2.5 30 70
Semester 5
CM 3311 Artificial Intelligence C 2 1 2.5 40 60
CM 3211 Automata Theory C 2 1 2.5 30 70
CM 3131 Applied Numerical Methods E 2 1 2.5 30 70
IN 3111 Network programming C 2 1 2.5 30 70
IN 3101 Enterprise Application Development C 2 1 2.5 40 60
IN 3700 Human Computer Interaction C 2 1 2.5 40 60
IN 3210 Mobile Applications Development E 2 1 2.5 30 70
IN 3510 Wireless Communication & Mobile Networks E 2 1 2.5 30 70
IN 3320 Embedded Systems E 2 1 2.5 40 60
IS 3610 Management Information Systems C 2 1 2.5 30 70
IS 3011 Communication Skills and Professional Conduct (Non GPA) C 1 2 2 40 60
Semester 6
CM 3321 Logic Programming and Artificial Cognitive Systems C 2 1 2.5 40 60
IN 3901 Independent Study C 2 100 0
IN 3910 Research Methodology C 2 2 3 30 70
IN 3410 Data Mining and Data Warehousing C 2 1 2.5 30 70
IS 3450 Business and Entrepreneureship C 2 1 2.5 30 70
IS 3001 Scientific Communication C 2 1 2.5 40 60
Semester 7
CM 4371 Machine Learning & Pattern Recognition C 2 1 2.5 30 70
IN 4911 Comprehensive Group Project C/E 10 100 0
IN 4210 Advanced Software Engineering C 2 1 2.5 30 70
IN 4921 Individual Research Project C/E 10 100 0
IS 3700 IT Project Management C 2 1 2.5 40 60
CM 3121 Statistical Computing E 2 1 2.5 30 70
CM 3331 Fundamentals of Bioinformatics E 2 1 2.5 30 70
CM 4161 Advanced Topics in Statistics E 2 1 2.5 30 70
CM 4151 Mathematical and Computational Modeling E 2 1 2.5 30 70
CM 4141 Operational Research E 2 1 2.5 40 60
CM 4211 Theory of Computability & Complexity E 2 1 2.5 40 60
CM 4221 Theory of Compilers E 2 1 2.5 40 60
CM 4231 Formal Methods and Software Verification E 2 1 2.5 30 70
CM 4311 Artificial Neural Networks & Evolutionary Computing E 2 1 2.5 30 70
CM 4321 Complex Systems & Agent Technology E 2 1 2.5 40 60
CM 4331 Semantic Web and Ontological Modelling E 2 1 2.5 30 70
CM 4341 Natural Language Processing E 2 1 2.5 30 70
CM 4351 Fuzzy logic E 2 1 2.5 30 70
CM 4361 Robotics E 2 1 2.5 30 70
CM 4381 Deep Learning Architectures E 2 1 2.5 30 70
CM 4391 Advanced Topics in Bioinformatics E 2 1 2.5 30 70
CM 4411 Reinforcement Learning E 2 1 2.5 30 70
CM 4131 Discrete Mathematics E 2 1 2.5 30 70
CM 4171 Integral Transformations E 2 1 2.5 30 70
IN 4770 Cloud Computing E 2 1 2.5 30 70
IN 4330 Parallel Processing E 2 1 2.5 30 70
IN 4740 UI/UX Engineering E 2 1 2.5 50 50
IN 4750 Ubiquitous and Wearable Computing E 2 1 2.5 30 70
IN 4320 Internet of Things E 2 1 2.5 40 60
IN 4440 Advanced Database Management Systems E 2 1 2.5 50 50
IN 4101 Theory of Programming Languages E 2 1 2.5 30 70
IN 4550 Cyber Security E 2 1 2.5 30 70
IN 4521 High Speed Communication Networks E 2 1 2.5 40 60
IN 4531 Multimedia Communications E 2 1 2.5 30 70
IN 4541 Performance Evaluation of Computer Networks E 2 1 2.5 30 70
IN 4660 Digital Signal Processing E 2 1 2.5 30 70
IN 4621 Digital Image Processing E 2 1 2.5 30 70
IN 4640 Machine Vision E 2 1 2.5 30 70
IN 4650 Audio Processing and Speech Synthesis E 2 1 2.5 30 70
IN 4701 Distributed Systems and Cluster Computing E 2 1 2.5 30 70
IN 4721 Geographic Information Systems E 2 1 2.5 40 60
IN 4731 High Performance Computing E 2 1 2.5 40 60
IN 4220 Software Architecture and Design Patterns E 2 1 2.5 40 60
IN 4601 Multimedia Systems E 2 1 2.5 30 70
IN 4760 Location Based Services and Systems E 2 1 2.5 40 60
IN 4670 Digital Forgery Analysis E 2 1 2.5 30 70
IN 4630 Game Theory E 2 1 2.5 40 60
IN 4430 Digital Resource Archiving & Information Retrieval E 2 1 2.5 30 70
IN 4411 Big Data Analytics E 2 1 2.5 40 60
IN 4560 Information Security E 2 1 2.5 30 70
IS 4600 IT Quality Assurance E 2 1 2.5 40 60
IS 4650 Software Management E 2 1 2.5 40 60
IS 4620 Information Systems Management E 2 1 2.5 30 70
IS 4720 Management of Sensitive Projects E 2 1 2.5 40 60
IS 3200 Digital Business Management E 2 1 2.5 50 50
IS 3720 Supply Chain Management E 2 1 2.5 30 70
IS 4630 Cloud Infrastructure Management E 2 1 2.5 50 50
IS 4640 Knowledge Representation and Management E 2 1 2.5 40 60
IS 3120 Organizational Behaviour E 2 1 2.5 40 60
IS 3300 Management Accounting E 2 1 2.5 30 70
IS 4430 Social Aspects of IT E 2 1 2.5 40 60
IS 4460 Social Entrepreneurship E 2 1 2.5 40 60
IS 4000 Educational Technology E 2 1 2.5 40 60
IS 4470 Business Intelligence E 2 1 2.5 40 60
IS 3730 Talent Management E 2 1 2.5 40 60
IS 4480 International Business E 2 1 2.5 30 70
IS 3410 Forensic Accounting and Fraud Investigations E 2 1 2.5 30 70
IS 4100 Corporate Governance and Social Responsibility E 2 1 2.5 40 60
IS 4350 Financial Engineering E 2 1 2.5 30 70
IS 3510 Fundamentals of Behavioural Genetics E 2 1 2.5 30 70
IS 4500 Advanced Topics in Behavioural Genetics E 2 1 2.5 30 70
IS 3520 Fundamentals of Behavioural Science E 2 1 2.5 40 60
IS 4530 Applied Behavioural Science E 2 1 2.5 30 70
IS 3020 Human Communication & Language Structures E 2 1 2.5 40 60
IS 3310 Accounting Information System E 2 1 2.5 30 70
IS 4490 Information Technology Law E 2 1 2.5 30 70
IS 4440 Professional Practice E 2 1 2.5 40 60
`

interface ParsedModule {
  code: string;
  name: string;
  credits: number;
  semester: string;
  programme: string; // "IT", "ITM", "AI"
  isNonGpa: boolean;
}

const allModules: Map<string, ParsedModule> = new Map()

function parseText(text: string, programme: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l)
  let currentSemester = 'Semester 1'

  for (const line of lines) {
    if (line.includes('Semester') || line.includes('Level')) {
      const match = line.match(/Semester\s*([I|V|X]+|\d)/i)
      if (match) {
        let semRaw = match[1].toUpperCase()
        if (semRaw === 'I') semRaw = '1'
        if (semRaw === 'II') semRaw = '2'
        if (semRaw === 'III') semRaw = '3'
        if (semRaw === 'IV') semRaw = '4'
        if (semRaw === 'V') semRaw = '5'
        if (semRaw === 'VI') semRaw = '6'
        if (semRaw === 'VII') semRaw = '7'
        if (semRaw === 'VIII') semRaw = '8'
        currentSemester = `Semester ${semRaw}`
      } else {
        if (line.includes('Semester 7')) currentSemester = 'Semester 7'
        if (line.includes('Semester 8')) currentSemester = 'Semester 8'
      }
      continue
    }

    // Match code
    // E.g. "CM 1111 Fundamentals of Mathematics C 2 1 2.5 30 70"
    // "IN 3001 Industrial Training C 6.0 100 0"
    const regex = /^([A-Z]{2})\s*(\d{4})\s+(.+?)\s+(?:[C|E|C\/E])\s*(.*)$/
    const match = line.match(regex)
    if (match) {
      const prefix = match[1]
      const num = match[2]
      let name = match[3]
      const rest = match[4]

      // Extract credits. Credits is usually the 3rd or 4th number depending on the format.
      // But notice some lines: "C 2.5 100" or "C 2 1 2.5 30 70"
      // Wait, there's an easier way: find the first float/int that could be credits.
      // Actually, looking at the string "2 1 2.5 30 70", the credits is "2.5".
      // Let's use a regex to pick out numbers:
      const numbers = rest.match(/[\d\.]+/g)
      let credits = 3.0
      
      if (numbers) {
        if (numbers.length >= 3) {
          credits = parseFloat(numbers[2])
        } else if (numbers.length === 1) {
           // For e.g. "C 3.0 100" where "3.0" is the 1st number, or "C 2.5"
           credits = parseFloat(numbers[0])
        } else if (numbers.length === 2) {
          // E.g "C 6.0 100" -> credits = 6.0
          credits = parseFloat(numbers[0])
        }
      }

      // Check for NGPA
      let isNonGpa = false
      if (name.includes('NGPA') || name.includes('Non GPA') || name.includes('Non-GPA')) {
        isNonGpa = true
        name = name.replace(/\(NGPA\)/gi, '').trim()
      }

      const code = `${prefix}${num}`

      if (allModules.has(code)) {
        // If it already exists, merge programme
        const existing = allModules.get(code)!
        if (!existing.programme.includes(programme)) {
          existing.programme = existing.programme === 'All' ? 'All' : 'All'
        }
      } else {
        allModules.set(code, {
          code,
          name,
          credits,
          semester: currentSemester,
          programme,
          isNonGpa
        })
      }
    }
  }
}

async function main() {
  parseText(aiText, 'AI')
  parseText(itmText, 'ITM')
  parseText(itText, 'IT')

  console.log(`Parsed ${allModules.size} unique modules. Migrating...`)

  let updated = 0
  for (const mod of allModules.values()) {
    // If it's a known non-technical module, set to 'All'
    if (['DI1015', 'DI1018', 'DI1001', 'IS1011'].includes(mod.code)) {
      mod.programme = 'All'
      mod.isNonGpa = true
    }

    await prisma.subject.upsert({
      where: { code: mod.code },
      update: {
        name: mod.name,
        credits: mod.credits,
        semester: mod.semester,
        programme: mod.programme,
        isNonGpa: mod.isNonGpa
      },
      create: {
        code: mod.code,
        name: mod.name,
        credits: mod.credits,
        semester: mod.semester,
        programme: mod.programme,
        isNonGpa: mod.isNonGpa
      }
    })
    updated++
  }

  console.log(`Successfully imported ${updated} modules!`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
