import type {WorkRecord,Member,Workspace} from '../types';
export const COURSE_START=new Date('2026-10-05T00:00:00+01:00');
export const CURRENT_WEEK=()=>Math.max(1,Math.min(10,Math.floor((Date.now()-COURSE_START.getTime())/604800000)+1));
export const WEEKS=[
 {n:1,dates:'5–9 Oct',name:'Welcome & Introduction',goal:'Create your group workspace and understand the ethnographic research portfolio.',official:'Work in a 3–5 person research group; create a shared Methods Portfolio.',tasks:['Create shared workspace','Discuss initial student-experience ideas','Read course requirements']},
 {n:2,dates:'12–16 Oct',name:'Participant Observation',goal:'Explore participant observation and begin narrowing the research setting.',official:'Learn participant observation; reflect on access, ethics and participation.',tasks:['Sketch candidate research settings','Identify possible observation practices','Record initial assumptions']},
 {n:3,dates:'19–23 Oct',name:'Ethnographic Research Design',goal:'Develop a focused, exploratory research question and identify a workable study.',official:'Develop research ideas and questions (by Week 3).',tasks:['Create RQ draft v1','Identify potential field sites','Specify provisional participant criteria','Record group feedback']},
 {n:4,dates:'26–30 Oct',name:'Embodied Participation',goal:'Agree on a topic and design participant observation and recruitment.',official:'Agree a research topic by Week 4; plan observation and recruitment.',tasks:['Agree on research topic','Draft observation plan','Identify access permissions','Outline recruitment plan']},
 {n:5,dates:'2–6 Nov',name:'Interviews in Ethnographic Research',goal:'Finalise research design, interview topics and ethical preparation.',official:'Finalise RQ, who/where, observation plan; prepare recruitment, consent and interview guide.',tasks:['Finalise RQ','Confirm participants and site','Draft interview guide (2–3 topics)','Prepare participant information and consent materials','Schedule observation sessions']},
 {n:6,dates:'9–13 Nov',name:'Reading / Research Week',goal:'Begin the designated fieldwork window.',official:'Fieldwork runs 9–27 November 2026; each member must practise interviews and observation.',tasks:['Check ethical prerequisites','Start interviews and observation','Document fieldwork notes']},
 {n:7,dates:'16–20 Nov',name:'Creative & Collaborative Methods',goal:'Continue fieldwork; use class time for template work and troubleshooting.',official:'Class time for methods template, feedback and research issues.',tasks:['Review method coverage for each member','Update portfolio with research decisions','Respond to tutor feedback']},
 {n:8,dates:'23–27 Nov',name:'Thematic Analysis',goal:'Complete data collection and GDPR training.',official:'GDPR training completed by Week 8; fieldwork ends 27 November.',tasks:['Complete GDPR training','Finish interviews and observation','Check anonymised notes and session time logs']},
 {n:9,dates:'30 Nov–4 Dec',name:'Ethnographic Writing',goal:'Bring research notes to class and analyse patterns.',official:'Data collection complete; bring interview and observation notes to class.',tasks:['Identify themes manually','Prepare ethnographic vignette','Discuss research limitations']},
 {n:10,dates:'7–11 Dec',name:'Assessment Session',goal:'Prepare an independent 2,300-word Methods Reflection.',official:'Methods Reflection due Friday 11 December 2026, 13:00 UK.',tasks:['Select two Part A sections','Review three mandatory Part B sections','Check bibliography and AI acknowledgement','Submit independently by deadline']}
] as const;
export const PORTFOLIO=[
 {id:'aims',number:'01',title:'Research Aims & Question',hint:'Explain how the question developed, decisions, assumptions and class feedback.'},
 {id:'location',number:'02',title:'Research Locations & Access',hint:'Justify research sites, access and any required permission.'},
 {id:'participants',number:'03',title:'Participants & Inclusion Criteria',hint:'Justify recruitment criteria relevant to the research question.'},
 {id:'observation',number:'04',title:'Participant Observation',hint:'Plan embodied participation, observations and fieldnotes.'},
 {id:'interviews',number:'05',title:'Semi-structured Interviews',hint:'Explain the interview approach and 2–3 topic guide.'},
 {id:'ethics',number:'06',title:'Ethically Engaged Research',hint:'Document consent, positionality, risk, privacy and research decisions.'},
 {id:'analysis',number:'07',title:'Analysis of Ethnographic Data',hint:'Explain themes, interpretation and individual vignettes.'}
];
export const RQ_CHECKS=[
 {label:'Clear and focused',note:'One or two precise sentences rather than several research questions.'},
 {label:'Minimises assumptions',note:'Does not presuppose a particular experience or outcome.'},
 {label:'Exploratory',note:'Leaves scope for unanticipated findings.'},
 {label:'Ethnographically researchable',note:'Can be investigated through interviews and participant observation.'},
 {label:'Relevant to UCL student experience',note:'Stays within the module theme.'},
 {label:'Feasible and low-risk',note:'Accessible to a small study of 2–4 participants, with proper permissions.'}
];
export const DEMO_ID='demo-workspace';
export const DEMO_WORKSPACE:Workspace={id:DEMO_ID,name:'Bloomsbury Knowledge Access',course_code:'ANTH0130',created_by:'demo-owner'};
export const DEMO_MEMBERS:Member[]=[
 {id:'dm1',workspace_id:DEMO_ID,user_id:'demo-owner',display_name:'You',role:'owner',gdpr_completed_at:null},
 {id:'dm2',workspace_id:DEMO_ID,user_id:'member-a',display_name:'Member A',role:'member'},
 {id:'dm3',workspace_id:DEMO_ID,user_id:'member-b',display_name:'Member B',role:'member'}
];
export const DEMO_RECORDS:WorkRecord[]=[
 {id:'demo-rq',workspace_id:DEMO_ID,record_type:'rq',title:'RQ draft v1',created_by:'demo-owner',created_at:'2026-10-19T12:00:00Z',data:{question:'How do UCL postgraduate students encounter and navigate institutional boundaries when accessing academic resources at other Bloomsbury universities?',aims:'Explore lived access to libraries and educational spaces, including institutional rules and everyday practices.',rationale:'Working hypothesis for group discussion; not an agreed final RQ.',version:1,status:'Draft'}},
 {id:'demo-task1',workspace_id:DEMO_ID,record_type:'task',title:'Discuss RQ draft with the group',created_by:'demo-owner',data:{week:3,status:'In progress',lead:'demo-owner',due:'2026-10-23',priority:'High',detail:'Review exploratory scope and remove assumptions.'}},
 {id:'demo-task2',workspace_id:DEMO_ID,record_type:'task',title:'Check SOAS library research access',created_by:'demo-owner',data:{week:3,status:'To do',lead:'member-a',due:'2026-10-23',priority:'High',detail:'Distinguish student entry conditions from permission to conduct research.'}},
 {id:'demo-task3',workspace_id:DEMO_ID,record_type:'task',title:'Map observation settings',created_by:'demo-owner',data:{week:4,status:'To do',lead:'member-b',due:'2026-10-30',priority:'Medium',detail:'Find accessible and ethically suitable social settings.'}},
 {id:'demo-site1',workspace_id:DEMO_ID,record_type:'site',title:'SOAS Library',created_by:'demo-owner',data:{institution:'SOAS',type:'Library',rationale:'Explore cross-institutional access as lived experience.',permission:'Unverified',access:'Check entry rules separately from permission for research.'}},
 {id:'demo-decision',workspace_id:DEMO_ID,record_type:'decision',title:'Scope of cross-institutional access',created_by:'demo-owner',data:{status:'Open',options:'Library only / Library and classroom access',rationale:'Needs group agreement and permission check.'}}
];
