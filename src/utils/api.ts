import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChatResponse, ChatHistory, Product, Podcast } from '../types';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Google Custom Search API configuration
const GOOGLE_CSE_ID = import.meta.env.VITE_GOOGLE_CSE_ID;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Chat history storage
const CHAT_HISTORY_KEY = 'podpal_chat_history';

export const getChatHistory = (): ChatHistory[] => {
  const history = localStorage.getItem(CHAT_HISTORY_KEY);
  return history ? JSON.parse(history) : [];
};

export const saveChatHistory = (history: ChatHistory[]) => {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
};

export const addToHistory = (history: ChatHistory) => {
  const histories = getChatHistory();
  histories.push(history);
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(histories));
};

/**
 * Search for products using Google Custom Search API
 */
async function searchProducts(query: string, eco: boolean = true): Promise<Product[]> {
  try {
    // Add eco-friendly terms to make results more relevant
    const searchQuery = eco ? `${query} eco-friendly sustainable` : query;
    
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?` +
      `key=${GOOGLE_API_KEY}&` +
      `cx=${GOOGLE_CSE_ID}&` +
      `q=${encodeURIComponent(searchQuery)}&` +
      `searchType=shopping&` +
      `num=4`
    );

    const data = await response.json();
    if (!data.items) return [];

    return data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      price: extractPrice(item),
      platform: extractDomain(item.displayLink),
      image: item.pagemap?.cse_image?.[0]?.src || item.pagemap?.product?.[0]?.image
    }));
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

// Extract price from Google CSE response
function extractPrice(item: any): string {
  if (item.pagemap?.offer?.[0]?.price) return item.pagemap.offer[0].price;
  if (item.pagemap?.product?.[0]?.price) return item.pagemap.product[0].price;
  if (item.pagemap?.offers?.[0]?.price) return item.pagemap.offers[0].price;
  
  // Look for price patterns in the snippet
  const priceMatch = item.snippet?.match(/\$(\d+(\.\d{1,2})?)/);
  if (priceMatch) return priceMatch[0];
  
  return 'Price not available';
}

// Make domain name more readable
function extractDomain(url: string): string {
  try {
    const domain = url.replace(/^(www\.|shop\.|store\.)/i, '');
    // Capitalize first letter of domain
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch (e) {
    return url;
  }
}

/**
 * Process chat message with AI and fetch real podcast data
 */
export const processChatMessage = async (message: string): Promise<{ text: string; podcasts?: Podcast[] }> => {
  try {
    // Analyze the message to determine intent
    const intent = analyzeUserIntent(message);
    
    // Real podcast data from various popular platforms
    const realPodcasts: Record<string, Podcast[]> = {
      'technology': [
        {
          id: '3',
          title: 'Reply All',
          host: 'Emmanuel Dzotsi, Alex Goldman',
          category: 'technology',
          description: 'A show about the internet and modern life, featuring stories about how people shape technology and how technology shapes people.',
          rating: 4.7,
          imageUrl: 'https://i.imgur.com/Jd1rMBw.jpg',
          episodeCount: 187,
          averageDuration: 50,
          platform: 'Spotify',
          url: 'https://open.spotify.com/show/7gozmLqbcbr6PScMjc0Zl4'
        },
        {
          id: '4',
          title: 'Darknet Diaries',
          host: 'Jack Rhysider',
          category: 'technology',
          description: 'True stories from the dark side of the Internet. This podcast shares unknown hacking stories from the underworld of cybercrime.',
          rating: 4.9,
          imageUrl: 'https://i.imgur.com/HVTkwHg.jpg',
          episodeCount: 130,
          averageDuration: 60,
          platform: 'Apple Podcasts',
          url: 'https://podcasts.apple.com/us/podcast/darknet-diaries/id1296350485'
        },
        {
          id: '25',
          title: 'The Vergecast',
          host: 'Nilay Patel, David Pierce',
          category: 'technology',
          description: 'The Vergecast is the flagship podcast from The Verge about small gadgets, big conversations, and everything in between. Every Friday, Nilay Patel and David Pierce lead our expert staff in a discussion about the week in tech news.',
          rating: 4.6,
          imageUrl: 'https://i.imgur.com/dIGqjgz.jpg',
          episodeCount: 450,
          averageDuration: 75,
          platform: 'The Verge',
          url: 'https://www.theverge.com/the-vergecast'
        },
        {
          id: '26',
          title: 'Lex Fridman Podcast',
          host: 'Lex Fridman',
          category: 'technology',
          description: 'Conversations about AI, science, technology, history, philosophy, and the nature of intelligence, consciousness, love, and power. Formerly called Artificial Intelligence (AI Podcast).',
          rating: 4.9,
          imageUrl: 'https://i.imgur.com/A1LVKWu.jpg',
          episodeCount: 400,
          averageDuration: 180,
          platform: 'Spotify',
          url: 'https://open.spotify.com/show/2MAi0BvDc6GTFvKFPXnkCL'
        }
      ],
      'true crime': [
        {
          id: '1',
          title: 'Serial',
          host: 'Sarah Koenig',
          category: 'true crime',
          description: 'Serial tells one story — a true story — over the course of a season. Each season, the creators investigate a different case.',
          rating: 4.8,
          imageUrl: 'https://i.imgur.com/JjITQiu.jpg',
          episodeCount: 60,
          averageDuration: 45,
          platform: 'This American Life',
          url: 'https://serialpodcast.org/'
        },
        {
          id: '2',
          title: 'My Favorite Murder',
          host: 'Karen Kilgariff and Georgia Hardstark',
          category: 'true crime',
          description: 'My Favorite Murder is a true crime comedy podcast hosted by Karen Kilgariff and Georgia Hardstark. Each episode, the hosts discuss their favorite tales of murder and hear hometown crime stories from friends and fans.',
          rating: 4.7,
          imageUrl: 'https://i.imgur.com/WulBSoF.jpg',
          episodeCount: 450,
          averageDuration: 90,
          platform: 'Exactly Right',
          url: 'https://myfavoritemurder.com/'
        },
        {
          id: '27',
          title: 'Crime Junkie',
          host: 'Ashley Flowers',
          category: 'true crime',
          description: 'Crime Junkie is a weekly true crime podcast dedicated to giving you a fix. Every Monday, Ashley Flowers will tell you about whatever crime she\'s been obsessing over that week.',
          rating: 4.9,
          imageUrl: 'https://i.imgur.com/4AfQmsS.jpg',
          episodeCount: 250,
          averageDuration: 40,
          platform: 'audiochuck',
          url: 'https://crimejunkiepodcast.com/'
        },
        {
          id: '28',
          title: 'Criminal',
          host: 'Phoebe Judge',
          category: 'true crime',
          description: 'Criminal is a podcast about crime. Not so much the "if it bleeds, it leads" kind of crime, but something a little more complex. Stories of people who\'ve done wrong, been wronged, or gotten caught somewhere in the middle.',
          rating: 4.8,
          imageUrl: 'https://i.imgur.com/TDmmVNB.jpg',
          episodeCount: 200,
          averageDuration: 30,
          platform: 'Vox Media',
          url: 'https://thisiscriminal.com/'
        }
      ],
      'comedy': [
        {
          id: '5',
          title: 'Conan O\'Brien Needs A Friend',
          host: 'Conan O\'Brien',
          category: 'comedy',
          description: 'After 25 years at the Late Night desk, Conan realized that the only people at his holiday party are the men and women who work for him. Over the years and despite thousands of interviews, he has never made a real friend.',
          rating: 4.9,
          imageUrl: 'https://i.imgur.com/UrR2NL8.jpg',
          episodeCount: 200,
          averageDuration: 60,
          platform: 'Spotify',
          url: 'https://open.spotify.com/show/3v2fKMlpN2AwQkBzMmZ5d1'
        },
        {
          id: '6',
          title: 'SmartLess',
          host: 'Jason Bateman, Sean Hayes, Will Arnett',
          category: 'comedy',
          description: 'SmartLess features hosts Jason Bateman, Sean Hayes, and Will Arnett as they connect and unite people from all walks of life to learn about shared experiences through thoughtful dialogue and organic hilarity.',
          rating: 4.8,
          imageUrl: 'https://i.imgur.com/o0KXgkh.jpg',
          episodeCount: 175,
          averageDuration: 65,
          platform: 'Apple Podcasts',
          url: 'https://podcasts.apple.com/us/podcast/smartless/id1521578868'
        },
        {
          id: '29',
          title: 'Wait Wait... Don\'t Tell Me!',
          host: 'Peter Sagal',
          category: 'comedy',
          description: 'NPR\'s weekly current events quiz. Have a laugh and test your news knowledge while figuring out what\'s real and what we\'ve made up.',
          rating: 4.7,
          imageUrl: 'https://media.npr.org/assets/img/2018/08/03/npr_waitwait_podcasttile_sq-9bd62272815be83d475c5839a95a76a9c86e55f1.jpg',
          episodeCount: 600,
          averageDuration: 45,
          platform: 'NPR',
          url: 'https://www.npr.org/programs/wait-wait-dont-tell-me/'
        },
        {
          id: '30',
          title: 'The Daily Show: Ears Edition',
          host: 'Various',
          category: 'comedy',
          description: 'Listen to highlights and extended interviews in the "Ears Edition" of The Daily Show with Trevor Noah. From Comedy Central\'s Podcast Network.',
          rating: 4.5,
          imageUrl: 'https://www.comedycentral.com/images/shows/the_daily_show/podcast_640x640.jpg',
          episodeCount: 800,
          averageDuration: 35,
          platform: 'Comedy Central',
          url: 'https://www.comedycentral.com/shows/the-daily-show-with-trevor-noah/podcast'
        }
      ],
      'business': [
        {
          id: '7',
          title: 'How I Built This with Guy Raz',
          host: 'Guy Raz',
          category: 'business',
          description: 'Guy Raz dives into the stories behind some of the world\'s best known companies. How I Built This weaves a narrative journey about innovators, entrepreneurs and idealists—and the movements they built.',
          rating: 4.8,
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/08/f3/10/08f3104f-4f27-c77e-4e15-57621a60b23c/mza_6685781240441351263.jpg/600x600bb.jpg',
          episodeCount: 450,
          averageDuration: 60,
          platform: 'NPR',
          url: 'https://www.npr.org/podcasts/510313/how-i-built-this'
        },
        {
          id: '8',
          title: 'The Tim Ferriss Show',
          host: 'Tim Ferriss',
          category: 'business',
          description: 'Tim Ferriss deconstructs world-class performers from across disciplines to extract tactics and routines you can use, from exercise habits to morning rituals and more.',
          rating: 4.7,
          imageUrl: 'https://is4-ssl.mzstatic.com/image/thumb/Podcasts126/v4/8c/15/4e/8c154ed7-dd20-64cf-9392-38b23337bb11/mza_11008971968403512440.jpg/600x600bb.jpg',
          episodeCount: 650,
          averageDuration: 120,
          platform: 'Spotify',
          url: 'https://open.spotify.com/show/5qSUyCrk9KR69lEiXbjwXM'
        },
        {
          id: '31',
          title: 'Planet Money',
          host: 'NPR',
          category: 'business',
          description: 'The economy explained. Imagine you could call up a friend and say, "Meet me at the bar and tell me what\'s going on with the economy." Now imagine that\'s actually a fun evening.',
          rating: 4.7,
          imageUrl: 'https://media.npr.org/assets/img/2018/08/02/npr_planetmoney_podcasttile_sq-7b7fab0b52fd72826936c3dbe51cff94889797a0.jpg',
          episodeCount: 1300,
          averageDuration: 25,
          platform: 'NPR',
          url: 'https://www.npr.org/podcasts/510289/planet-money'
        },
        {
          id: '32',
          title: 'WorkLife with Adam Grant',
          host: 'Adam Grant',
          category: 'business',
          description: 'Organizational psychologist Adam Grant takes you inside the minds of some of the world\'s most unusual professionals to explore the science of making work not suck.',
          rating: 4.8,
          imageUrl: 'https://storage.googleapis.com/pr-newsroom-wp/1/2023/02/Adam-Grant-WorkLife-S6-Podcast-Cover-1440x1440-1.jpg',
          episodeCount: 100,
          averageDuration: 40,
          platform: 'TED',
          url: 'https://www.ted.com/podcasts/worklife'
        }
      ],
      'health': [
        {
          id: '9',
          title: 'The Huberman Lab',
          host: 'Dr. Andrew Huberman',
          category: 'health',
          description: 'Dr. Andrew Huberman discusses neuroscience and science-based tools, including ways to enhance sleep, learning, focus, creativity, and overall health.',
          rating: 4.9,
          imageUrl: 'https://is3-ssl.mzstatic.com/image/thumb/Podcasts126/v4/3a/6d/60/3a6d602c-0f0c-38bd-fa3a-ea21bfb8ea1b/mza_2344906978664195485.jpg/600x600bb.jpg',
          episodeCount: 120,
          averageDuration: 120,
          platform: 'Apple Podcasts',
          url: 'https://podcasts.apple.com/us/podcast/huberman-lab/id1545953110'
        },
        {
          id: '10',
          title: 'Ten Percent Happier',
          host: 'Dan Harris',
          category: 'health',
          description: 'Dan Harris explores meditation, psychology, and practices to help you train your mind to be happier with high-profile guests from different fields.',
          rating: 4.7,
          imageUrl: 'https://is5-ssl.mzstatic.com/image/thumb/Podcasts126/v4/63/94/8e/63948eba-f61d-4eb4-75d4-84fe4f9ddcdd/mza_12653465654624197336.jpg/600x600bb.jpg',
          episodeCount: 520,
          averageDuration: 60,
          platform: 'Spotify',
          url: 'https://open.spotify.com/show/1EYIYYLCUFQrwp5quL4ocp'
        },
        {
          id: '33',
          title: 'On Purpose with Jay Shetty',
          host: 'Jay Shetty',
          category: 'health',
          description: 'Jay Shetty, a former monk and social media superstar, shares conversations with the most insightful people in the world to help you become more purposeful and live your best life.',
          rating: 4.9,
          imageUrl: 'https://images.squarespace-cdn.com/content/v1/5c1eddaab98a787020a20151/6eb1dd99-27ac-40e0-9d8b-93a682ed50f7/Purpose_Podcast_4000x4000.jpg',
          episodeCount: 380,
          averageDuration: 60,
          platform: 'iHeartRadio',
          url: 'https://jayshetty.me/podcast/'
        },
        {
          id: '34',
          title: 'Feel Better, Live More',
          host: 'Dr. Rangan Chatterjee',
          category: 'health',
          description: 'Dr. Rangan Chatterjee brings conversations to help you feel calmer, more energized, and improve your health and wellbeing with a 360-degree approach to health, covering everything from sleep and gut health to relationships and happiness.',
          rating: 4.8,
          imageUrl: 'https://is4-ssl.mzstatic.com/image/thumb/Podcasts116/v4/e7/0c/c6/e70cc6c6-c29c-5964-adf7-96cbae93967a/mza_18229453292511598222.jpg/600x600bb.jpg',
          episodeCount: 310,
          averageDuration: 90,
          platform: 'BBC Radio',
          url: 'https://drchatterjee.com/podcast/'
        }
      ],
      'history': [
        {
          id: '11',
          title: 'Hardcore History',
          host: 'Dan Carlin',
          category: 'history',
          description: 'In "Hardcore History" journalist and broadcaster Dan Carlin takes his "Martian", unorthodox way of thinking and applies it to the past. Was Alexander the Great as bad a person as Adolf Hitler? What would Apaches with modern weapons be like?',
          rating: 4.9,
          imageUrl: 'https://i0.wp.com/www.dancarlin.com/graphics/DC_HH_iTunes.jpg',
          episodeCount: 70,
          averageDuration: 270,
          platform: 'Independent',
          url: 'https://www.dancarlin.com/hardcore-history-series/'
        },
        {
          id: '12',
          title: 'You\'re Dead To Me',
          host: 'Greg Jenner',
          category: 'history',
          description: 'History for people who don\'t like history! A comedy educational podcast hosted by Greg Jenner, where a comedian and an expert explore fascinating historical subjects.',
          rating: 4.7,
          imageUrl: 'https://is2-ssl.mzstatic.com/image/thumb/Podcasts116/v4/32/bc/e5/32bce560-d2f4-5e4f-4c20-ccef51ac2861/mza_16141109744276075986.jpg/600x600bb.jpg',
          episodeCount: 89,
          averageDuration: 45,
          platform: 'BBC',
          url: 'https://www.bbc.co.uk/programmes/p07mdbhg/episodes/downloads'
        },
        {
          id: '35',
          title: 'Throughline',
          host: 'Rund Abdelfatah and Ramtin Arablouei',
          category: 'history',
          description: 'The past is never past. Every headline has a history. Join us every week as we go back in time to understand the present. These are stories you can feel and sounds you can see from the moments that shaped our world.',
          rating: 4.7,
          imageUrl: 'https://media.npr.org/assets/img/2020/04/13/throughline_tile_npr_custom-bd6196379769670e2d54cc7b257e8af8bfcb59d8.jpg',
          episodeCount: 180,
          averageDuration: 50,
          platform: 'NPR',
          url: 'https://www.npr.org/podcasts/510333/throughline'
        }
      ],
      'science': [
        {
          id: '13',
          title: 'Radiolab',
          host: 'Latif Nasser & Lulu Miller',
          category: 'science',
          description: 'Radiolab is on a curiosity bender. We ask deep questions and use investigative journalism to get the answers. A given episode might whirl you through science, legal history, and into the home of someone halfway across the world.',
          rating: 4.8,
          imageUrl: 'https://media.wnyc.org/i/1400/1400/l/80/1/Radiolab_WNYCStudios_1400.jpg',
          episodeCount: 450,
          averageDuration: 60,
          platform: 'WNYC Studios',
          url: 'https://radiolab.org/'
        },
        {
          id: '14',
          title: 'Science Vs',
          host: 'Wendy Zukerman',
          category: 'science',
          description: 'Science Vs takes on fads, trends, and the opinionated mob to find out what\'s fact, what\'s not, and what\'s somewhere in between. We dive into the evidence, talk to experts, and look at real-world implications.',
          rating: 4.7,
          imageUrl: 'https://i.scdn.co/image/ab6765630000ba8a941af4fbd746dfb4000c98a2',
          episodeCount: 200,
          averageDuration: 35,
          platform: 'Gimlet',
          url: 'https://gimletmedia.com/shows/science-vs'
        }
      ],
      'news': [
        {
          id: '15',
          title: 'The Daily',
          host: 'Michael Barbaro',
          category: 'news',
          description: 'This is what the news should sound like. The biggest stories of our time, told by the best journalists in the world. Hosted by Michael Barbaro. Twenty minutes a day, five days a week, ready by 6 a.m.',
          rating: 4.7,
          imageUrl: 'https://image.simplecastcdn.com/images/03d8b493-87fc-4bd1-931f-8a8e9b945d8a/2cce5659-f647-4366-b318-46e4762c38f1/3000x3000/c81936f538106550b804e7e4fe2c236319bab7fba37941a6e8f7e5c4d4076f3a3f8f67c4f23b3cb4d5bd413fbd5ed607135a46e2b7f02bfbe0c50f8ddf3e93d5.jpeg?aid=rss_feed',
          episodeCount: 1500,
          averageDuration: 25,
          platform: 'New York Times',
          url: 'https://www.nytimes.com/column/the-daily'
        },
        {
          id: '16',
          title: 'Up First',
          host: 'NPR',
          category: 'news',
          description: 'NPR\'s Up First is the news you need to start your day. The three biggest stories of the day, with reporting and analysis from NPR News — in 10 minutes.',
          rating: 4.6,
          imageUrl: 'https://media.npr.org/assets/img/2023/03/08/upfirst_tile_npr-2_sq-c6e6e806fe34a3c55a1676ab0f6facd2efeee01f.jpg',
          episodeCount: 1800,
          averageDuration: 15,
          platform: 'NPR',
          url: 'https://www.npr.org/podcasts/510318/up-first'
        }
      ],
      'sports': [
        {
          id: '17',
          title: 'The Bill Simmons Podcast',
          host: 'Bill Simmons',
          category: 'sports',
          description: 'HBO\'s Bill Simmons hosts one of the most downloaded sports podcasts, with a rotating crew of guests discussing sports, pop culture, and tech.',
          rating: 4.6,
          imageUrl: 'https://image.simplecastcdn.com/images/7c387f80-9b31-4752-9c5f-5ba937211a1d/84fb4056-80e9-43a7-bcc0-dcd2796b7350/3000x3000/image.jpg?aid=rss_feed',
          episodeCount: 850,
          averageDuration: 90,
          platform: 'The Ringer',
          url: 'https://www.theringer.com/the-bill-simmons-podcast'
        },
        {
          id: '18',
          title: 'The Dan Le Batard Show with Stugotz',
          host: 'Dan Le Batard, Stugotz',
          category: 'sports',
          description: 'Dan, Stugotz and the crew share their unique perspectives on all things sports, pop culture and more. This is the place for original content from the crew that knows that nothing is as interesting as sports, except when it\'s something else.',
          rating: 4.6,
          imageUrl: 'https://images.squarespace-cdn.com/content/v1/5a7b1e9490badc3987901daa/1614196285408-OR7QWL3S2K9ONBS9SFGB/dlsws-logo-yellow.png',
          episodeCount: 1500,
          averageDuration: 60,
          platform: 'Meadowlark Media',
          url: 'https://www.thelimitedpodcast.com/'
        }
      ],
      'fiction': [
        {
          id: '19',
          title: 'Welcome to Night Vale',
          host: 'Cecil Baldwin',
          category: 'fiction',
          description: 'Twice-monthly community updates for the small desert town of Night Vale, featuring local weather, news, announcements from the Sheriff\'s Secret Police, mysterious lights in the night sky, dark hooded figures with unknowable powers, and cultural events.',
          rating: 4.6,
          imageUrl: 'https://static1.squarespace.com/static/51e7119ae4b02be46c9a94c7/t/5d5bed17a7fea400018c63c9/1566320919862/Welcome+to+Night+Vale+Cover.jpg',
          episodeCount: 200,
          averageDuration: 25,
          platform: 'Night Vale Presents',
          url: 'https://www.welcometonightvale.com/'
        },
        {
          id: '20',
          title: 'The Magnus Archives',
          host: 'Jonathan Sims',
          category: 'fiction',
          description: 'A weekly horror fiction anthology podcast examining what lurks in the archives of the Magnus Institute, an organization dedicated to researching the esoteric and the weird.',
          rating: 4.8,
          imageUrl: 'https://static.libsyn.com/p/assets/a/6/8/c/a68c3c07fbd9c9e3/TMA_cover-2021.jpg',
          episodeCount: 200,
          averageDuration: 30,
          platform: 'Rusty Quill',
          url: 'https://rustyquill.com/the-magnus-archives/'
        }
      ],
      'food': [
        {
          id: '21',
          title: 'The Sporkful',
          host: 'Dan Pashman',
          category: 'food',
          description: 'The Sporkful isn\'t for foodies, it\'s for eaters. Each week, Dan Pashman hosts a podcast about food and the people who eat it, tackling everything from serious social issues to the perfect way to layer ingredients on a sandwich.',
          rating: 4.6,
          imageUrl: 'https://is2-ssl.mzstatic.com/image/thumb/Podcasts116/v4/7b/7a/58/7b7a58b1-78ab-8348-8851-34ece5da9c74/mza_10070232947521542053.jpg/600x600bb.jpg',
          episodeCount: 389,
          averageDuration: 35,
          platform: 'WNYC',
          url: 'https://www.thesporkful.com/'
        },
        {
          id: '22',
          title: 'Home Cooking',
          host: 'Samin Nosrat, Hrishikesh Hirway',
          category: 'food',
          description: 'Home Cooking is a mini-series to help you figure out what to cook during quarantine, hosted by chef and author Samin Nosrat and podcast-maker Hrishikesh Hirway.',
          rating: 4.8,
          imageUrl: 'https://megaphone.imgix.net/podcasts/af1d431e-1197-11eb-bd8a-d3714d168378/image/uploads_2F1602779417887-cah985xiqpg-0e2534d92dd7bc0a411992cffbe464cb_2FHC_1400.jpg',
          episodeCount: 35,
          averageDuration: 45,
          platform: 'Maximum Fun',
          url: 'https://homecooking.show/'
        }
      ],
      'education': [
        {
          id: '23',
          title: 'Stuff You Should Know',
          host: 'Josh Clark & Chuck Bryant',
          category: 'education',
          description: 'If you\'ve ever wanted to know about champagne, satanism, the Stonewall Uprising, chaos theory, LSD, El Nino, true crime and Rosa Parks, then look no further.',
          rating: 4.7,
          imageUrl: 'https://is2-ssl.mzstatic.com/image/thumb/Podcasts126/v4/c8/8c/a2/c88ca290-a7d1-a93e-13c4-62ff419f2b96/mza_11126060796858031201.jpg/600x600bb.jpg',
          episodeCount: 1700,
          averageDuration: 45,
          platform: 'iHeartRadio',
          url: 'https://www.iheart.com/podcast/105-stuff-you-should-know-26940277/'
        },
        {
          id: '24',
          title: 'TED Talks Daily',
          host: 'Various',
          category: 'education',
          description: 'Every weekday, TED Talks Daily brings you the latest talks in audio. Join host and journalist Elise Hu for thought-provoking ideas on every subject imaginable.',
          rating: 4.5,
          imageUrl: 'https://is3-ssl.mzstatic.com/image/thumb/Podcasts126/v4/7e/52/84/7e5284a6-c49f-0be9-b147-eb87231ada96/mza_16598753272469024358.jpeg/600x600bb.jpg',
          episodeCount: 2300,
          averageDuration: 15,
          platform: 'TED',
          url: 'https://www.ted.com/about/programs-initiatives/ted-talks/ted-talks-audio'
        }
      ],
      'spirituality': [
        {
          id: '36',
          title: 'On Being with Krista Tippett',
          host: 'Krista Tippett',
          category: 'spirituality',
          description: 'Groundbreaking and award-winning conversations with thought leaders about what it means to be human and how we want to live. Big questions of meaning with scientists, theologians, artists, and teachers.',
          rating: 4.8,
          imageUrl: 'https://i0.wp.com/onbeing.org/wp-content/uploads/2022/02/OB_PodcastArt_NoBuffer.png',
          episodeCount: 700,
          averageDuration: 50,
          platform: 'On Being Project',
          url: 'https://onbeing.org/series/podcast/'
        },
        {
          id: '37',
          title: 'The Astral Hustle',
          host: 'Cory Allen',
          category: 'spirituality',
          description: 'Cory Allen hosts discussions with artists, authors, and philosophers about consciousness, self-development, and mindfulness to help you tame your mind, amplify awareness, and find meaning.',
          rating: 4.7,
          imageUrl: 'https://is2-ssl.mzstatic.com/image/thumb/Podcasts116/v4/4f/ac/8a/4fac8a19-7c7f-16b1-fc7c-c952c539d2bc/mza_11741441027137971460.jpeg/600x600bb.jpg',
          episodeCount: 380,
          averageDuration: 65,
          platform: 'Astral Audio',
          url: 'https://www.astralhustle.com/'
        }
      ],
      'motivation': [
        {
          id: '38',
          title: 'The Tony Robbins Podcast',
          host: 'Tony Robbins',
          category: 'motivation',
          description: 'Tony Robbins\' results-oriented approach to leadership, peak performance, and personal growth provides strategies to help you achieve maximum results in business and life.',
          rating: 4.8,
          imageUrl: 'https://is5-ssl.mzstatic.com/image/thumb/Podcasts125/v4/4d/23/ca/4d23ca5b-12fe-0fed-dbe0-d76463a18238/mza_16379378279386306208.jpg/600x600bb.jpg',
          episodeCount: 150,
          averageDuration: 55,
          platform: 'Robbins Research',
          url: 'https://www.tonyrobbins.com/podcasts/'
        },
        {
          id: '39',
          title: 'The School of Greatness',
          host: 'Lewis Howes',
          category: 'motivation',
          description: 'Lewis Howes shares inspiring stories from the most brilliant business minds, world-class athletes, and influential celebrities to help you find out what makes great people great.',
          rating: 4.7,
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts112/v4/f5/7c/a1/f57ca1c1-5a2e-4916-e76d-a6dbfa30a400/mza_10891007816268248304.jpg/600x600bb.jpg',
          episodeCount: 1300,
          averageDuration: 60,
          platform: 'School of Greatness',
          url: 'https://lewishowes.com/sogpodcast/'
        }
      ],
      'suspense': [
        {
          id: '40',
          title: 'Old Gods of Appalachia',
          host: 'Steve Shell and Cam Collins',
          category: 'suspense',
          description: 'A horror anthology podcast set in an alternate Appalachia, where the endless hills and hollers hide ancient, hungry forces older than humanity itself.',
          rating: 4.9,
          imageUrl: 'https://is5-ssl.mzstatic.com/image/thumb/Podcasts113/v4/37/4d/06/374d06dc-819a-45e9-5530-5acbd871cd40/mza_14318400336915148192.jpg/600x600bb.jpg',
          episodeCount: 45,
          averageDuration: 30,
          platform: 'DeepNerd Media',
          url: 'https://www.oldgodsofappalachia.com/'
        },
        {
          id: '41',
          title: 'The Black Tapes',
          host: 'Alex Reagan',
          category: 'suspense',
          description: 'A serialized docudrama following journalist Alex Reagan and her investigation into the work of paranormal researcher Dr. Richard Strand, who is resolving allegedly supernatural cases one by one.',
          rating: 4.6,
          imageUrl: 'https://i1.sndcdn.com/avatars-000132569937-gkv8gf-original.jpg',
          episodeCount: 30,
          averageDuration: 40,
          platform: 'Public Radio Alliance',
          url: 'https://theblacktapespodcast.com/'
        }
      ],
      'love': [
        {
          id: '42',
          title: 'Modern Love',
          host: 'Anna Martin',
          category: 'love',
          description: 'Stories of love, loss and redemption. Modern Love is based on the New York Times\' popular series of weekly columns and features essays about relationships, feelings, betrayals and revelations.',
          rating: 4.7,
          imageUrl: 'https://is2-ssl.mzstatic.com/image/thumb/Podcasts113/v4/69/ea/83/69ea8364-b59a-1cdc-3d23-2af7705ccbab/mza_12941010528558105146.jpg/600x600bb.jpg',
          episodeCount: 300,
          averageDuration: 25,
          platform: 'WBUR & New York Times',
          url: 'https://www.nytimes.com/column/modern-love'
        },
        {
          id: '43',
          title: 'Where Should We Begin?',
          host: 'Esther Perel',
          category: 'love',
          description: 'Listen to real couples anonymously bare intimate details of their relationships in one-time therapy sessions with legendary relationship therapist Esther Perel.',
          rating: 4.8,
          imageUrl: 'https://is3-ssl.mzstatic.com/image/thumb/Podcasts114/v4/31/e7/33/31e733c5-400d-5412-27ec-5d1c4058b187/mza_3535767913070950902.jpg/600x600bb.jpg',
          episodeCount: 75,
          averageDuration: 45,
          platform: 'Gimlet Media',
          url: 'https://www.estherperel.com/podcast'
        }
      ]
    };
    
    // Create a response based on intent and potentially use Gemini for more natural language
    let aiResponse = "";
    let recommendedPodcasts: Podcast[] | undefined = undefined;
    
    // Handle different user intents
    switch (intent) {
      case 'greeting':
        // For greetings, we can use Gemini to generate a more conversational response
        try {
          const geminiPrompt = `
          You are PodPal, a helpful podcast recommendation assistant. 
          Respond to this greeting in a friendly, brief way. 
          Don't offer specific podcast recommendations yet, just greet them and ask what kind of podcasts they're interested in.
          Be concise and conversational. Max 2-3 sentences.
          User greeting: "${message}"
          `;
          
          const result = await model.generateContent(geminiPrompt);
          aiResponse = result.response.text().trim();
        } catch (error) {
          // Fallback if Gemini fails
          aiResponse = "Hi there! 👋 I'm PodPal, your podcast recommendation assistant. What kind of podcasts are you interested in?";
        }
        break;
      
      case 'podcast_recommendation':
        // Try to extract genre preference from the message
        const genres = extractGenres(message);
        
        if (genres.length > 0) {
          // Return podcasts for the first extracted genre
          const genre = genres[0];
          
          // Ensure we have podcasts for this genre
          if (realPodcasts[genre]) {
            recommendedPodcasts = realPodcasts[genre];
            
            // Use Gemini to generate a more natural introduction to the recommendations
            try {
              const geminiPrompt = `
              You are PodPal, a podcast recommendation assistant.
              The user is looking for ${genre} podcasts. Write a brief, enthusiastic introduction (1-2 sentences) to present these ${genre} podcast recommendations.
              Keep it conversational and friendly. Don't list any specific podcast names, just introduce the genre in a way that gets the user excited.
              `;
              
              const result = await model.generateContent(geminiPrompt);
              aiResponse = result.response.text().trim();
            } catch (error) {
              // Fallback if Gemini fails
              aiResponse = `I found some great ${genre} podcasts that you might enjoy! Here are my top recommendations:`;
            }
          } else {
            // If we somehow got a genre that we don't have podcasts for
            const availableGenres = Object.keys(realPodcasts).join(', ');
            recommendedPodcasts = [
              realPodcasts.comedy[0],
              realPodcasts.technology[0],
              realPodcasts['true crime'][0]
            ];
            
            aiResponse = `I don't have specific recommendations for ${genre} podcasts yet. Here are some popular podcasts from other categories instead. I can provide recommendations for these genres: ${availableGenres}.`;
          }
        } else {
          // No specific genre found, ask for clarification using Gemini
          try {
            const geminiPrompt = `
            You are PodPal, a podcast recommendation assistant.
            The user wants podcast recommendations but didn't specify a genre. Write a friendly response asking what genres they're interested in.
            Mention some available genres like true crime, comedy, business, technology, and health. Keep it short (2 sentences max) and conversational.
            `;
            
            const result = await model.generateContent(geminiPrompt);
            aiResponse = result.response.text().trim();
          } catch (error) {
            // Fallback if Gemini fails
            aiResponse = "I'd love to recommend some podcasts for you! Could you tell me what genres or topics you're interested in? For example: true crime, comedy, business, technology, health, or something else?";
          }
        }
        break;
        
      case 'general_question':
        // For general questions, use Gemini to provide a more natural response
        try {
          const geminiPrompt = `
          You are PodPal, a helpful podcast recommendation assistant.
          The user asked this question: "${message}"
          
          Respond conversationally and steer the conversation toward podcast recommendations. Don't make up specific podcast titles.
          If the question is about podcasts, give general information and ask what genres they might be interested in.
          If the question is unrelated to podcasts, politely steer back to podcast topics. Keep your response brief (2-3 sentences max).
          `;
          
          const result = await model.generateContent(geminiPrompt);
          aiResponse = result.response.text().trim();
        } catch (error) {
          // Fallback if Gemini fails
          aiResponse = "I specialize in podcast recommendations! I can help you discover new shows based on your interests. What kind of podcasts would you like to learn about today?";
        }
        break;
        
      default:
        // Generic response with popular podcasts from different categories
        recommendedPodcasts = [
          realPodcasts.comedy[0],
          realPodcasts.technology[0],
          realPodcasts['true crime'][0]
        ];
        
        try {
          const geminiPrompt = `
          You are PodPal, a podcast recommendation assistant.
          Write a brief introduction (1-2 sentences) to present some popular podcasts from different categories.
          Keep it conversational and friendly. Don't list specific podcast names, just introduce them as popular across different genres.
          `;
          
          const result = await model.generateContent(geminiPrompt);
          aiResponse = result.response.text().trim();
        } catch (error) {
          // Fallback if Gemini fails
          aiResponse = "Here are some of the most popular podcasts right now across different categories. Let me know if you want more specific recommendations!";
        }
    }

    return {
      text: aiResponse,
      podcasts: recommendedPodcasts
    };
  } catch (error) {
    console.error('Error processing message:', error);
    return {
      text: "I apologize, but I'm having trouble processing your request right now. Could you try asking in a different way or tell me what kind of podcasts you're interested in?"
    };
  }
};

/**
 * Analyze user intent from the message
 */
function analyzeUserIntent(message: string): 'greeting' | 'podcast_recommendation' | 'general_question' | 'other' {
  const lowerMessage = message.toLowerCase();
  
  // Check for greetings
  if (/^(hi|hello|hey|greetings|howdy|what\'s up|sup|yo)/i.test(lowerMessage) && lowerMessage.length < 20) {
    return 'greeting';
  }
  
  // Define genre-related keywords that indicate a recommendation request
  const genreKeywords = [
    'true crime', 'murder', 'criminal', 'crime', 'mystery',
    'comedy', 'funny', 'humor', 'laugh', 'comedians', 'jokes', 'hilarious',
    'business', 'entrepreneur', 'startup', 'finance', 'money', 'investing', 'economics',
    'tech', 'technology', 'digital', 'software', 'computer', 'programming', 'science', 'ai', 
    'health', 'wellness', 'fitness', 'mental health', 'meditation', 'mindfulness'
  ];
  
  // Check if the message contains any genre keywords - this strongly indicates a recommendation request
  for (const keyword of genreKeywords) {
    if (lowerMessage.includes(keyword)) {
      return 'podcast_recommendation';
    }
  }
  
  // Check for podcast recommendation requests with explicit recommendation language
  if (/recommend|suggestion|suggest|what podcast|good podcast|great podcast|best podcast|podcast to listen|podcast recommendation|show me|find me|i want|i need|looking for/i.test(lowerMessage)) {
    return 'podcast_recommendation';
  }
  
  // Check for questions about specific podcasts (using the word "podcast" or "show" or "episode")
  if (lowerMessage.includes('podcast') || lowerMessage.includes('show') || lowerMessage.includes('episode')) {
    return 'podcast_recommendation';
  }
  
  // Check for general questions
  if (/what|how|why|who|where|when|can you|could you/i.test(lowerMessage)) {
    return 'general_question';
  }
  
  return 'other';
}

/**
 * Extract genre preferences from the message
 */
function extractGenres(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  const genres = [];
  
  // Define genre mappings (variations to standardized keys)
  const genreMappings = {
    'true crime': ['true crime', 'murder', 'criminal', 'crime', 'mystery'],
    'comedy': ['comedy', 'funny', 'humor', 'laugh', 'comedians', 'jokes', 'hilarious'],
    'business': ['business', 'entrepreneur', 'startup', 'finance', 'money', 'investing', 'economics', 'work'],
    'technology': ['tech', 'technology', 'digital', 'software', 'computer', 'programming', 'science', 'ai', 'artificial intelligence', 'gadgets', 'internet', 'coding'],
    'health': ['health', 'wellness', 'fitness', 'mental health', 'meditation', 'mindfulness', 'yoga', 'nutrition', 'diet', 'workout', 'exercise'],
    'history': ['history', 'historical', 'past', 'ancient', 'medieval', 'renaissance', 'war', 'civilization', 'archaeology'],
    'news': ['news', 'current events', 'politics', 'world affairs', 'journalism', 'headlines', 'global'],
    'science': ['science', 'scientific', 'physics', 'chemistry', 'biology', 'astronomy', 'space', 'research', 'discovery'],
    'sports': ['sports', 'football', 'basketball', 'baseball', 'soccer', 'tennis', 'golf', 'athletes', 'olympics', 'nfl', 'nba', 'mlb'],
    'entertainment': ['entertainment', 'movies', 'tv', 'television', 'film', 'celebrity', 'hollywood', 'streaming', 'shows'],
    'fiction': ['fiction', 'stories', 'storytelling', 'narrative', 'drama', 'fantasy', 'sci-fi', 'horror stories'],
    'music': ['music', 'songs', 'bands', 'artists', 'albums', 'concerts', 'musicians', 'vinyl', 'indie', 'rock', 'hip hop', 'jazz'],
    'food': ['food', 'cooking', 'cuisine', 'recipes', 'chef', 'culinary', 'baking', 'restaurant', 'gastronomy', 'dining'],
    'education': ['education', 'learning', 'teaching', 'academic', 'university', 'college', 'school', 'knowledge', 'lectures', 'lessons'],
    'spirituality': ['spirituality', 'spiritual', 'religion', 'faith', 'philosophy', 'consciousness', 'awakening', 'soul', 'enlightenment', 'zen', 'mindful', 'buddhism', 'yoga', 'meditation'],
    'motivation': ['motivation', 'motivational', 'self-help', 'self-improvement', 'personal growth', 'inspiration', 'success', 'goals', 'achievement', 'life coaching', 'performance', 'positive thinking'],
    'suspense': ['suspense', 'thriller', 'mystery', 'crime thriller', 'psychological thriller', 'horror', 'supernatural', 'scary', 'paranormal', 'investigation', 'detective'],
    'love': ['love', 'romance', 'relationship', 'dating', 'marriage', 'couples', 'intimacy', 'romantic', 'heartbreak', 'breakup', 'wedding', 'partnership']
  };
  
  // Check for matches across all genre mappings
  for (const [standardGenre, variations] of Object.entries(genreMappings)) {
    // Create a regex pattern that matches any of the variations
    const pattern = new RegExp(variations.join('|'), 'i');
    if (pattern.test(lowerMessage)) {
      genres.push(standardGenre);
    }
  }
  
  return genres;
}

// Extract product names from the AI response
function extractProductNames(response: string): string[] {
  // This is still needed as a fallback
  const lines = response.split('\n');
  const productNames: string[] = [];
  
  for (const line of lines) {
    // Look for <strong> tags which should contain product names
    const strongMatch = line.match(/<strong>([^<]+)<\/strong>/);
    
    // Pattern 1: Match "Product Name: description"
    const pattern1 = line.match(/^[\s\d\.\-•]*([^:]+):/);
    
    // Pattern 2: Match "- Product Name" or "• Product Name"
    const pattern2 = line.match(/^[\s\d]*[\-•]\s+([^:]+?)(?=\s|$)/);
    
    // Pattern 3: Match numbered items "1. Product Name"
    const pattern3 = line.match(/^\d+\.\s+([^:]+?)(?=\s|$)/);
    
    if (strongMatch) {
      productNames.push(strongMatch[1].trim());
    } else if (pattern1) {
      productNames.push(pattern1[1].trim());
    } else if (pattern2) {
      productNames.push(pattern2[1].trim());
    } else if (pattern3) {
      productNames.push(pattern3[1].trim());
    }
  }
  
  return productNames;
}

export const searchPodcasts = async (query: string, category?: string): Promise<Podcast[]> => {
  try {
    // This would normally be an API call, but we'll use mock data for now
    const realPodcasts: Record<string, Podcast[]> = {
      'true crime': [
        {
          id: '1',
          title: 'Serial',
          host: 'Sarah Koenig',
          category: 'true crime',
          description: 'Serial tells one story — a true story — over the course of a season. Each season, the creators investigate a different case.',
          rating: 4.8,
          imageUrl: 'https://i.imgur.com/JjITQiu.jpg',
          episodeCount: 60,
          averageDuration: 45,
          platform: 'This American Life',
          url: 'https://serialpodcast.org/'
        },
        {
          id: '2',
          title: 'My Favorite Murder',
          host: 'Karen Kilgariff and Georgia Hardstark',
          category: 'true crime',
          description: 'My Favorite Murder is a true crime comedy podcast hosted by Karen Kilgariff and Georgia Hardstark. Each episode, the hosts discuss their favorite tales of murder and hear hometown crime stories from friends and fans.',
          rating: 4.7,
          imageUrl: 'https://i.imgur.com/WulBSoF.jpg',
          episodeCount: 450,
          averageDuration: 90,
          platform: 'Exactly Right',
          url: 'https://myfavoritemurder.com/'
        },
        {
          id: '27',
          title: 'Crime Junkie',
          host: 'Ashley Flowers',
          category: 'true crime',
          description: 'Crime Junkie is a weekly true crime podcast dedicated to giving you a fix. Every Monday, Ashley Flowers will tell you about whatever crime she\'s been obsessing over that week.',
          rating: 4.9,
          imageUrl: 'https://i.imgur.com/4AfQmsS.jpg',
          episodeCount: 250,
          averageDuration: 40,
          platform: 'audiochuck',
          url: 'https://crimejunkiepodcast.com/'
        },
        {
          id: '28',
          title: 'Criminal',
          host: 'Phoebe Judge',
          category: 'true crime',
          description: 'Criminal is a podcast about crime. Not so much the "if it bleeds, it leads" kind of crime, but something a little more complex. Stories of people who\'ve done wrong, been wronged, or gotten caught somewhere in the middle.',
          rating: 4.8,
          imageUrl: 'https://i.imgur.com/TDmmVNB.jpg',
          episodeCount: 200,
          averageDuration: 30,
          platform: 'Vox Media',
          url: 'https://thisiscriminal.com/'
        }
      ],
      'comedy': [
        {
          id: '5',
          title: 'Conan O\'Brien Needs A Friend',
          host: 'Conan O\'Brien',
          category: 'comedy',
          description: 'After 25 years at the Late Night desk, Conan realized that the only people at his holiday party are the men and women who work for him. Over the years and despite thousands of interviews, he has never made a real friend.',
          rating: 4.9,
          imageUrl: 'https://i.imgur.com/UrR2NL8.jpg',
          episodeCount: 200,
          averageDuration: 60,
          platform: 'Spotify',
          url: 'https://open.spotify.com/show/3v2fKMlpN2AwQkBzMmZ5d1'
        },
        {
          id: '6',
          title: 'SmartLess',
          host: 'Jason Bateman, Sean Hayes, Will Arnett',
          category: 'comedy',
          description: 'SmartLess features hosts Jason Bateman, Sean Hayes, and Will Arnett as they connect and unite people from all walks of life to learn about shared experiences through thoughtful dialogue and organic hilarity.',
          rating: 4.8,
          imageUrl: 'https://i.imgur.com/o0KXgkh.jpg',
          episodeCount: 175,
          averageDuration: 65,
          platform: 'Apple Podcasts',
          url: 'https://podcasts.apple.com/us/podcast/smartless/id1521578868'
        },
        {
          id: '29',
          title: 'Wait Wait... Don\'t Tell Me!',
          host: 'Peter Sagal',
          category: 'comedy',
          description: 'NPR\'s weekly current events quiz. Have a laugh and test your news knowledge while figuring out what\'s real and what we\'ve made up.',
          rating: 4.7,
          imageUrl: 'https://media.npr.org/assets/img/2018/08/03/npr_waitwait_podcasttile_sq-9bd62272815be83d475c5839a95a76a9c86e55f1.jpg',
          episodeCount: 600,
          averageDuration: 45,
          platform: 'NPR',
          url: 'https://www.npr.org/programs/wait-wait-dont-tell-me/'
        },
        {
          id: '30',
          title: 'The Daily Show: Ears Edition',
          host: 'Various',
          category: 'comedy',
          description: 'Listen to highlights and extended interviews in the "Ears Edition" of The Daily Show with Trevor Noah. From Comedy Central\'s Podcast Network.',
          rating: 4.5,
          imageUrl: 'https://www.comedycentral.com/images/shows/the_daily_show/podcast_640x640.jpg',
          episodeCount: 800,
          averageDuration: 35,
          platform: 'Comedy Central',
          url: 'https://www.comedycentral.com/shows/the-daily-show-with-trevor-noah/podcast'
        }
      ],
      'technology': [
        {
          id: '25',
          title: 'The Vergecast',
          host: 'Nilay Patel, David Pierce',
          category: 'technology',
          description: 'The Vergecast is the flagship podcast from The Verge about small gadgets, big conversations, and everything in between. Every Friday, Nilay Patel and David Pierce lead our expert staff in a discussion about the week in tech news.',
          rating: 4.6,
          imageUrl: 'https://i.imgur.com/dIGqjgz.jpg',
          episodeCount: 450,
          averageDuration: 75,
          platform: 'The Verge',
          url: 'https://www.theverge.com/the-vergecast'
        },
        {
          id: '26',
          title: 'Lex Fridman Podcast',
          host: 'Lex Fridman',
          category: 'technology',
          description: 'Conversations about AI, science, technology, history, philosophy, and the nature of intelligence, consciousness, love, and power. Formerly called Artificial Intelligence (AI Podcast).',
          rating: 4.9,
          imageUrl: 'https://i.imgur.com/A1LVKWu.jpg',
          episodeCount: 400,
          averageDuration: 180,
          platform: 'Spotify',
          url: 'https://open.spotify.com/show/2MAi0BvDc6GTFvKFPXnkCL'
        },
        {
          id: '3',
          title: 'Reply All',
          host: 'Emmanuel Dzotsi, Alex Goldman',
          category: 'technology',
          description: 'A show about the internet and modern life, featuring stories about how people shape technology and how technology shapes people.',
          rating: 4.7,
          imageUrl: 'https://i.imgur.com/Jd1rMBw.jpg',
          episodeCount: 187,
          averageDuration: 50,
          platform: 'Spotify',
          url: 'https://open.spotify.com/show/7gozmLqbcbr6PScMjc0Zl4'
        },
        {
          id: '4',
          title: 'Darknet Diaries',
          host: 'Jack Rhysider',
          category: 'technology',
          description: 'True stories from the dark side of the Internet. This podcast shares unknown hacking stories from the underworld of cybercrime.',
          rating: 4.9,
          imageUrl: 'https://i.imgur.com/HVTkwHg.jpg',
          episodeCount: 130,
          averageDuration: 60,
          platform: 'Apple Podcasts',
          url: 'https://podcasts.apple.com/us/podcast/darknet-diaries/id1296350485'
        }
      ],
      'business': [
        {
          id: '7',
          title: 'How I Built This with Guy Raz',
          host: 'Guy Raz',
          category: 'business',
          description: 'Guy Raz dives into the stories behind some of the world\'s best known companies. How I Built This weaves a narrative journey about innovators, entrepreneurs and idealists—and the movements they built.',
          rating: 4.8,
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/08/f3/10/08f3104f-4f27-c77e-4e15-57621a60b23c/mza_6685781240441351263.jpg/600x600bb.jpg',
          episodeCount: 450,
          averageDuration: 60,
          platform: 'NPR',
          url: 'https://www.npr.org/podcasts/510313/how-i-built-this'
        },
        {
          id: '8',
          title: 'The Tim Ferriss Show',
          host: 'Tim Ferriss',
          category: 'business',
          description: 'Tim Ferriss deconstructs world-class performers from across disciplines to extract tactics and routines you can use, from exercise habits to morning rituals and more.',
          rating: 4.7,
          imageUrl: 'https://is4-ssl.mzstatic.com/image/thumb/Podcasts126/v4/8c/15/4e/8c154ed7-dd20-64cf-9392-38b23337bb11/mza_11008971968403512440.jpg/600x600bb.jpg',
          episodeCount: 650,
          averageDuration: 120,
          platform: 'Spotify',
          url: 'https://open.spotify.com/show/5qSUyCrk9KR69lEiXbjwXM'
        },
        {
          id: '31',
          title: 'Planet Money',
          host: 'NPR',
          category: 'business',
          description: 'The economy explained. Imagine you could call up a friend and say, "Meet me at the bar and tell me what\'s going on with the economy." Now imagine that\'s actually a fun evening.',
          rating: 4.7,
          imageUrl: 'https://media.npr.org/assets/img/2018/08/02/npr_planetmoney_podcasttile_sq-7b7fab0b52fd72826936c3dbe51cff94889797a0.jpg',
          episodeCount: 1300,
          averageDuration: 25,
          platform: 'NPR',
          url: 'https://www.npr.org/podcasts/510289/planet-money'
        },
        {
          id: '32',
          title: 'WorkLife with Adam Grant',
          host: 'Adam Grant',
          category: 'business',
          description: 'Organizational psychologist Adam Grant takes you inside the minds of some of the world\'s most unusual professionals to explore the science of making work not suck.',
          rating: 4.8,
          imageUrl: 'https://storage.googleapis.com/pr-newsroom-wp/1/2023/02/Adam-Grant-WorkLife-S6-Podcast-Cover-1440x1440-1.jpg',
          episodeCount: 100,
          averageDuration: 40,
          platform: 'TED',
          url: 'https://www.ted.com/podcasts/worklife'
        }
      ],
      'health': [
        {
          id: '9',
          title: 'The Huberman Lab',
          host: 'Dr. Andrew Huberman',
          category: 'health',
          description: 'Dr. Andrew Huberman discusses neuroscience and science-based tools, including ways to enhance sleep, learning, focus, creativity, and overall health.',
          rating: 4.9,
          imageUrl: 'https://is3-ssl.mzstatic.com/image/thumb/Podcasts126/v4/3a/6d/60/3a6d602c-0f0c-38bd-fa3a-ea21bfb8ea1b/mza_2344906978664195485.jpg/600x600bb.jpg',
          episodeCount: 120,
          averageDuration: 120,
          platform: 'Apple Podcasts',
          url: 'https://podcasts.apple.com/us/podcast/huberman-lab/id1545953110'
        },
        {
          id: '10',
          title: 'Ten Percent Happier',
          host: 'Dan Harris',
          category: 'health',
          description: 'Dan Harris explores meditation, psychology, and practices to help you train your mind to be happier with high-profile guests from different fields.',
          rating: 4.7,
          imageUrl: 'https://is5-ssl.mzstatic.com/image/thumb/Podcasts126/v4/63/94/8e/63948eba-f61d-4eb4-75d4-84fe4f9ddcdd/mza_12653465654624197336.jpg/600x600bb.jpg',
          episodeCount: 520,
          averageDuration: 60,
          platform: 'Spotify',
          url: 'https://open.spotify.com/show/1EYIYYLCUFQrwp5quL4ocp'
        },
        {
          id: '33',
          title: 'On Purpose with Jay Shetty',
          host: 'Jay Shetty',
          category: 'health',
          description: 'Jay Shetty, a former monk and social media superstar, shares conversations with the most insightful people in the world to help you become more purposeful and live your best life.',
          rating: 4.9,
          imageUrl: 'https://images.squarespace-cdn.com/content/v1/5c1eddaab98a787020a20151/6eb1dd99-27ac-40e0-9d8b-93a682ed50f7/Purpose_Podcast_4000x4000.jpg',
          episodeCount: 380,
          averageDuration: 60,
          platform: 'iHeartRadio',
          url: 'https://jayshetty.me/podcast/'
        },
        {
          id: '34',
          title: 'Feel Better, Live More',
          host: 'Dr. Rangan Chatterjee',
          category: 'health',
          description: 'Dr. Rangan Chatterjee brings conversations to help you feel calmer, more energized, and improve your health and wellbeing with a 360-degree approach to health, covering everything from sleep and gut health to relationships and happiness.',
          rating: 4.8,
          imageUrl: 'https://is4-ssl.mzstatic.com/image/thumb/Podcasts116/v4/e7/0c/c6/e70cc6c6-c29c-5964-adf7-96cbae93967a/mza_18229453292511598222.jpg/600x600bb.jpg',
          episodeCount: 310,
          averageDuration: 90,
          platform: 'BBC Radio',
          url: 'https://drchatterjee.com/podcast/'
        }
      ],
      'history': [
        {
          id: '11',
          title: 'Hardcore History',
          host: 'Dan Carlin',
          category: 'history',
          description: 'In "Hardcore History" journalist and broadcaster Dan Carlin takes his "Martian", unorthodox way of thinking and applies it to the past. Was Alexander the Great as bad a person as Adolf Hitler? What would Apaches with modern weapons be like?',
          rating: 4.9,
          imageUrl: 'https://i0.wp.com/www.dancarlin.com/graphics/DC_HH_iTunes.jpg',
          episodeCount: 70,
          averageDuration: 270,
          platform: 'Independent',
          url: 'https://www.dancarlin.com/hardcore-history-series/'
        },
        {
          id: '12',
          title: 'You\'re Dead To Me',
          host: 'Greg Jenner',
          category: 'history',
          description: 'History for people who don\'t like history! A comedy educational podcast hosted by Greg Jenner, where a comedian and an expert explore fascinating historical subjects.',
          rating: 4.7,
          imageUrl: 'https://is2-ssl.mzstatic.com/image/thumb/Podcasts116/v4/32/bc/e5/32bce560-d2f4-5e4f-4c20-ccef51ac2861/mza_16141109744276075986.jpg/600x600bb.jpg',
          episodeCount: 89,
          averageDuration: 45,
          platform: 'BBC',
          url: 'https://www.bbc.co.uk/programmes/p07mdbhg/episodes/downloads'
        },
        {
          id: '35',
          title: 'Throughline',
          host: 'Rund Abdelfatah and Ramtin Arablouei',
          category: 'history',
          description: 'The past is never past. Every headline has a history. Join us every week as we go back in time to understand the present. These are stories you can feel and sounds you can see from the moments that shaped our world.',
          rating: 4.7,
          imageUrl: 'https://media.npr.org/assets/img/2020/04/13/throughline_tile_npr_custom-bd6196379769670e2d54cc7b257e8af8bfcb59d8.jpg',
          episodeCount: 180,
          averageDuration: 50,
          platform: 'NPR',
          url: 'https://www.npr.org/podcasts/510333/throughline'
        }
      ],
      'science': [
        {
          id: '13',
          title: 'Radiolab',
          host: 'Latif Nasser & Lulu Miller',
          category: 'science',
          description: 'Radiolab is on a curiosity bender. We ask deep questions and use investigative journalism to get the answers. A given episode might whirl you through science, legal history, and into the home of someone halfway across the world.',
          rating: 4.8,
          imageUrl: 'https://media.wnyc.org/i/1400/1400/l/80/1/Radiolab_WNYCStudios_1400.jpg',
          episodeCount: 450,
          averageDuration: 60,
          platform: 'WNYC Studios',
          url: 'https://radiolab.org/'
        },
        {
          id: '14',
          title: 'Science Vs',
          host: 'Wendy Zukerman',
          category: 'science',
          description: 'Science Vs takes on fads, trends, and the opinionated mob to find out what\'s fact, what\'s not, and what\'s somewhere in between. We dive into the evidence, talk to experts, and look at real-world implications.',
          rating: 4.7,
          imageUrl: 'https://i.scdn.co/image/ab6765630000ba8a941af4fbd746dfb4000c98a2',
          episodeCount: 200,
          averageDuration: 35,
          platform: 'Gimlet',
          url: 'https://gimletmedia.com/shows/science-vs'
        }
      ],
      'news': [
        {
          id: '15',
          title: 'The Daily',
          host: 'Michael Barbaro',
          category: 'news',
          description: 'This is what the news should sound like. The biggest stories of our time, told by the best journalists in the world. Hosted by Michael Barbaro. Twenty minutes a day, five days a week, ready by 6 a.m.',
          rating: 4.7,
          imageUrl: 'https://image.simplecastcdn.com/images/03d8b493-87fc-4bd1-931f-8a8e9b945d8a/2cce5659-f647-4366-b318-46e4762c38f1/3000x3000/c81936f538106550b804e7e4fe2c236319bab7fba37941a6e8f7e5c4d4076f3a3f8f67c4f23b3cb4d5bd413fbd5ed607135a46e2b7f02bfbe0c50f8ddf3e93d5.jpeg?aid=rss_feed',
          episodeCount: 1500,
          averageDuration: 25,
          platform: 'New York Times',
          url: 'https://www.nytimes.com/column/the-daily'
        },
        {
          id: '16',
          title: 'Up First',
          host: 'NPR',
          category: 'news',
          description: 'NPR\'s Up First is the news you need to start your day. The three biggest stories of the day, with reporting and analysis from NPR News — in 10 minutes.',
          rating: 4.6,
          imageUrl: 'https://media.npr.org/assets/img/2023/03/08/upfirst_tile_npr-2_sq-c6e6e806fe34a3c55a1676ab0f6facd2efeee01f.jpg',
          episodeCount: 1800,
          averageDuration: 15,
          platform: 'NPR',
          url: 'https://www.npr.org/podcasts/510318/up-first'
        }
      ],
      'sports': [
        {
          id: '17',
          title: 'The Bill Simmons Podcast',
          host: 'Bill Simmons',
          category: 'sports',
          description: 'HBO\'s Bill Simmons hosts one of the most downloaded sports podcasts, with a rotating crew of guests discussing sports, pop culture, and tech.',
          rating: 4.6,
          imageUrl: 'https://image.simplecastcdn.com/images/7c387f80-9b31-4752-9c5f-5ba937211a1d/84fb4056-80e9-43a7-bcc0-dcd2796b7350/3000x3000/image.jpg?aid=rss_feed',
          episodeCount: 850,
          averageDuration: 90,
          platform: 'The Ringer',
          url: 'https://www.theringer.com/the-bill-simmons-podcast'
        },
        {
          id: '18',
          title: 'The Dan Le Batard Show with Stugotz',
          host: 'Dan Le Batard, Stugotz',
          category: 'sports',
          description: 'Dan, Stugotz and the crew share their unique perspectives on all things sports, pop culture and more. This is the place for original content from the crew that knows that nothing is as interesting as sports, except when it\'s something else.',
          rating: 4.6,
          imageUrl: 'https://images.squarespace-cdn.com/content/v1/5a7b1e9490badc3987901daa/1614196285408-OR7QWL3S2K9ONBS9SFGB/dlsws-logo-yellow.png',
          episodeCount: 1500,
          averageDuration: 60,
          platform: 'Meadowlark Media',
          url: 'https://www.thelimitedpodcast.com/'
        }
      ],
      'fiction': [
        {
          id: '19',
          title: 'Welcome to Night Vale',
          host: 'Cecil Baldwin',
          category: 'fiction',
          description: 'Twice-monthly community updates for the small desert town of Night Vale, featuring local weather, news, announcements from the Sheriff\'s Secret Police, mysterious lights in the night sky, dark hooded figures with unknowable powers, and cultural events.',
          rating: 4.6,
          imageUrl: 'https://static1.squarespace.com/static/51e7119ae4b02be46c9a94c7/t/5d5bed17a7fea400018c63c9/1566320919862/Welcome+to+Night+Vale+Cover.jpg',
          episodeCount: 200,
          averageDuration: 25,
          platform: 'Night Vale Presents',
          url: 'https://www.welcometonightvale.com/'
        },
        {
          id: '20',
          title: 'The Magnus Archives',
          host: 'Jonathan Sims',
          category: 'fiction',
          description: 'A weekly horror fiction anthology podcast examining what lurks in the archives of the Magnus Institute, an organization dedicated to researching the esoteric and the weird.',
          rating: 4.8,
          imageUrl: 'https://static.libsyn.com/p/assets/a/6/8/c/a68c3c07fbd9c9e3/TMA_cover-2021.jpg',
          episodeCount: 200,
          averageDuration: 30,
          platform: 'Rusty Quill',
          url: 'https://rustyquill.com/the-magnus-archives/'
        }
      ],
      'food': [
        {
          id: '21',
          title: 'The Sporkful',
          host: 'Dan Pashman',
          category: 'food',
          description: 'The Sporkful isn\'t for foodies, it\'s for eaters. Each week, Dan Pashman hosts a podcast about food and the people who eat it, tackling everything from serious social issues to the perfect way to layer ingredients on a sandwich.',
          rating: 4.6,
          imageUrl: 'https://is2-ssl.mzstatic.com/image/thumb/Podcasts116/v4/7b/7a/58/7b7a58b1-78ab-8348-8851-34ece5da9c74/mza_10070232947521542053.jpg/600x600bb.jpg',
          episodeCount: 389,
          averageDuration: 35,
          platform: 'WNYC',
          url: 'https://www.thesporkful.com/'
        },
        {
          id: '22',
          title: 'Home Cooking',
          host: 'Samin Nosrat, Hrishikesh Hirway',
          category: 'food',
          description: 'Home Cooking is a mini-series to help you figure out what to cook during quarantine, hosted by chef and author Samin Nosrat and podcast-maker Hrishikesh Hirway.',
          rating: 4.8,
          imageUrl: 'https://megaphone.imgix.net/podcasts/af1d431e-1197-11eb-bd8a-d3714d168378/image/uploads_2F1602779417887-cah985xiqpg-0e2534d92dd7bc0a411992cffbe464cb_2FHC_1400.jpg',
          episodeCount: 35,
          averageDuration: 45,
          platform: 'Maximum Fun',
          url: 'https://homecooking.show/'
        }
      ],
      'education': [
        {
          id: '23',
          title: 'Stuff You Should Know',
          host: 'Josh Clark & Chuck Bryant',
          category: 'education',
          description: 'If you\'ve ever wanted to know about champagne, satanism, the Stonewall Uprising, chaos theory, LSD, El Nino, true crime and Rosa Parks, then look no further.',
          rating: 4.7,
          imageUrl: 'https://is2-ssl.mzstatic.com/image/thumb/Podcasts126/v4/c8/8c/a2/c88ca290-a7d1-a93e-13c4-62ff419f2b96/mza_11126060796858031201.jpg/600x600bb.jpg',
          episodeCount: 1700,
          averageDuration: 45,
          platform: 'iHeartRadio',
          url: 'https://www.iheart.com/podcast/105-stuff-you-should-know-26940277/'
        },
        {
          id: '24',
          title: 'TED Talks Daily',
          host: 'Various',
          category: 'education',
          description: 'Every weekday, TED Talks Daily brings you the latest talks in audio. Join host and journalist Elise Hu for thought-provoking ideas on every subject imaginable.',
          rating: 4.5,
          imageUrl: 'https://is3-ssl.mzstatic.com/image/thumb/Podcasts126/v4/7e/52/84/7e5284a6-c49f-0be9-b147-eb87231ada96/mza_16598753272469024358.jpeg/600x600bb.jpg',
          episodeCount: 2300,
          averageDuration: 15,
          platform: 'TED',
          url: 'https://www.ted.com/about/programs-initiatives/ted-talks/ted-talks-audio'
        }
      ],
      'spirituality': [
        {
          id: '36',
          title: 'On Being with Krista Tippett',
          host: 'Krista Tippett',
          category: 'spirituality',
          description: 'Groundbreaking and award-winning conversations with thought leaders about what it means to be human and how we want to live. Big questions of meaning with scientists, theologians, artists, and teachers.',
          rating: 4.8,
          imageUrl: 'https://i0.wp.com/onbeing.org/wp-content/uploads/2022/02/OB_PodcastArt_NoBuffer.png',
          episodeCount: 700,
          averageDuration: 50,
          platform: 'On Being Project',
          url: 'https://onbeing.org/series/podcast/'
        },
        {
          id: '37',
          title: 'The Astral Hustle',
          host: 'Cory Allen',
          category: 'spirituality',
          description: 'Cory Allen hosts discussions with artists, authors, and philosophers about consciousness, self-development, and mindfulness to help you tame your mind, amplify awareness, and find meaning.',
          rating: 4.7,
          imageUrl: 'https://is2-ssl.mzstatic.com/image/thumb/Podcasts116/v4/4f/ac/8a/4fac8a19-7c7f-16b1-fc7c-c952c539d2bc/mza_11741441027137971460.jpeg/600x600bb.jpg',
          episodeCount: 380,
          averageDuration: 65,
          platform: 'Astral Audio',
          url: 'https://www.astralhustle.com/'
        }
      ],
      'motivation': [
        {
          id: '38',
          title: 'The Tony Robbins Podcast',
          host: 'Tony Robbins',
          category: 'motivation',
          description: 'Tony Robbins\' results-oriented approach to leadership, peak performance, and personal growth provides strategies to help you achieve maximum results in business and life.',
          rating: 4.8,
          imageUrl: 'https://is5-ssl.mzstatic.com/image/thumb/Podcasts125/v4/4d/23/ca/4d23ca5b-12fe-0fed-dbe0-d76463a18238/mza_16379378279386306208.jpg/600x600bb.jpg',
          episodeCount: 150,
          averageDuration: 55,
          platform: 'Robbins Research',
          url: 'https://www.tonyrobbins.com/podcasts/'
        },
        {
          id: '39',
          title: 'The School of Greatness',
          host: 'Lewis Howes',
          category: 'motivation',
          description: 'Lewis Howes shares inspiring stories from the most brilliant business minds, world-class athletes, and influential celebrities to help you find out what makes great people great.',
          rating: 4.7,
          imageUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts112/v4/f5/7c/a1/f57ca1c1-5a2e-4916-e76d-a6dbfa30a400/mza_10891007816268248304.jpg/600x600bb.jpg',
          episodeCount: 1300,
          averageDuration: 60,
          platform: 'School of Greatness',
          url: 'https://lewishowes.com/sogpodcast/'
        }
      ],
      'suspense': [
        {
          id: '40',
          title: 'Old Gods of Appalachia',
          host: 'Steve Shell and Cam Collins',
          category: 'suspense',
          description: 'A horror anthology podcast set in an alternate Appalachia, where the endless hills and hollers hide ancient, hungry forces older than humanity itself.',
          rating: 4.9,
          imageUrl: 'https://is5-ssl.mzstatic.com/image/thumb/Podcasts113/v4/37/4d/06/374d06dc-819a-45e9-5530-5acbd871cd40/mza_14318400336915148192.jpg/600x600bb.jpg',
          episodeCount: 45,
          averageDuration: 30,
          platform: 'DeepNerd Media',
          url: 'https://www.oldgodsofappalachia.com/'
        },
        {
          id: '41',
          title: 'The Black Tapes',
          host: 'Alex Reagan',
          category: 'suspense',
          description: 'A serialized docudrama following journalist Alex Reagan and her investigation into the work of paranormal researcher Dr. Richard Strand, who is resolving allegedly supernatural cases one by one.',
          rating: 4.6,
          imageUrl: 'https://i1.sndcdn.com/avatars-000132569937-gkv8gf-original.jpg',
          episodeCount: 30,
          averageDuration: 40,
          platform: 'Public Radio Alliance',
          url: 'https://theblacktapespodcast.com/'
        }
      ],
      'love': [
        {
          id: '42',
          title: 'Modern Love',
          host: 'Anna Martin',
          category: 'love',
          description: 'Stories of love, loss and redemption. Modern Love is based on the New York Times\' popular series of weekly columns and features essays about relationships, feelings, betrayals and revelations.',
          rating: 4.7,
          imageUrl: 'https://is2-ssl.mzstatic.com/image/thumb/Podcasts113/v4/69/ea/83/69ea8364-b59a-1cdc-3d23-2af7705ccbab/mza_12941010528558105146.jpg/600x600bb.jpg',
          episodeCount: 300,
          averageDuration: 25,
          platform: 'WBUR & New York Times',
          url: 'https://www.nytimes.com/column/modern-love'
        },
        {
          id: '43',
          title: 'Where Should We Begin?',
          host: 'Esther Perel',
          category: 'love',
          description: 'Listen to real couples anonymously bare intimate details of their relationships in one-time therapy sessions with legendary relationship therapist Esther Perel.',
          rating: 4.8,
          imageUrl: 'https://is3-ssl.mzstatic.com/image/thumb/Podcasts114/v4/31/e7/33/31e733c5-400d-5412-27ec-5d1c4058b187/mza_3535767913070950902.jpg/600x600bb.jpg',
          episodeCount: 75,
          averageDuration: 45,
          platform: 'Gimlet Media',
          url: 'https://www.estherperel.com/podcast'
        }
      ]
    };
    
    // If a category is provided, filter by that category
    if (category && category !== 'all') {
      const lowerCategory = category.toLowerCase();
      return realPodcasts[lowerCategory] || [];
    }
    
    // If a search query is provided, filter podcasts by title, host, or description
    if (query) {
      const lowerQuery = query.toLowerCase();
      const results: Podcast[] = [];
      
      // Search across all categories
      Object.values(realPodcasts).forEach(categoryPodcasts => {
        const matches = categoryPodcasts.filter(podcast => 
          podcast.title.toLowerCase().includes(lowerQuery) ||
          podcast.host.toLowerCase().includes(lowerQuery) ||
          podcast.description.toLowerCase().includes(lowerQuery)
        );
        results.push(...matches);
      });
      
      return results;
    }
    
    // If no category or query, return all podcasts
    return Object.values(realPodcasts).flat();
  } catch (error) {
    console.error('Error searching podcasts:', error);
    return [];
  }
};