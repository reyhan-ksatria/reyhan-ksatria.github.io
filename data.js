// Research entries listed in a chosen order; file is the document opened from the link under the preview, and preview is an image or PDF shown beside the entry or a blank frame when empty
const research = [
    {
        id: "research-weather", type: "Collaborative Research", period: "Jun 2026",
        title: "BBQ Weather Prediction in Basel Using Ensemble Machine Learning",
        summary: "Next-day classification of BBQ-suitable weather in Basel using a weighted voting ensemble of machine learning classifiers, with lag-based features to prevent label leakage, evaluated through bootstrap resampling and McNemar's test.",
        file: "files/weather-prediction.pdf", linkLabel: "View report", preview: "files/weather-prediction-cover.png"
    },
    {
        id: "research-thesis", type: "Undergraduate Thesis", period: "Feb 2026 – Sep 2026",
        title: "Parameter Estimation of the Weibull Distribution Using MLE with the BFGS Optimization Algorithm and Model Goodness-of-Fit Evaluation Using Kaplan–Meier",
        summary: "Estimation of Weibull distribution parameters for the lifetime data of lung cancer patients, using the BFGS optimization algorithm whose step length is determined by a line search satisfying the strong Wolfe conditions, and comparing the fitted survival curve against the Kaplan–Meier estimate through the Mean Absolute Error.",
        file: "files/skripsi-reyhan.pdf", linkLabel: "View thesis", preview: "files/skripsi-reyhan-cover.png"
    },
    {
        id: "research-internship", type: "Internship Research", period: "Jan 2026 – Feb 2026",
        title: "Comparative Analysis of Aircraft Ground Time Between Batik Air and Citilink Indonesia at Abdul Rachman Saleh Airport",
        summary: "Statistical analysis of aircraft ground time performance using the Mann–Whitney test and Cliff's Delta effect size estimation to evaluate operational differences between Batik Air and Citilink Indonesia.",
        file: "files/pkl-bandara.pdf", linkLabel: "View report", preview: "files/pkl-bandara-cover.png"
    }
];

// Project entries; fields lists every field a project belongs to with the main one first, the site shows the first project listed for each main field, so reorder within a field to change which one appears, only the main field is shown on its card, and zip is the path of the project ZIP file that the download button saves; an empty zip falls back to files/projects with the title in lowercase joined by hyphens, such as files/projects/jellyfish-species-classification.zip; size and contents are shown in the download confirmation, and either can be left out to hide that row
const projects = [
    { fields: ["Computer Vision", "Classification"], title: "Apples or Tomatoes - Image Classification", summary: "Classifying images of apples and tomatoes with transfer learning, using a classifier head built on EfficientNetB0 features that are reduced with PCA.", zip: "files/projects/apples-or-tomatoes-image-classification.zip", size: "45 MB", contents: ["Notebook", "README", "Dataset", "Checkpoints", "Images"] },
    { fields: ["Computer Vision", "Classification"], title: "Jellyfish Image Classification", summary: "Six-class image classification of jellyfish species using transfer learning with data augmentation.", zip: "" },
    { fields: ["NLP", "Classification"], title: "Fake News Classification", summary: "Classifying English news articles as fake or true with a Deep Neural Network built on a trainable embedding layer.", zip: "files/projects/fake-news-classification.zip", size: "84 MB", contents: ["Notebook", "README", "Dataset", "Checkpoints", "Images"] },
    { fields: ["NLP", "Classification"], title: "Tweet Emotions", summary: "Six-class emotion classification of tweets using a deep learning text model.", zip: "" },
    { fields: ["Time Series", "Regression"], title: "Daily Climate Time Series Data", summary: "Forecasting daily mean temperature in Delhi with a weighted ensemble of a Persistence Model and CatBoost.", zip: "files/projects/daily-climate-time-series-data.zip", size: "7 MB", contents: ["Notebook", "README", "Dataset", "Checkpoints", "Images"] },
    { fields: ["Clustering"], title: "Wine Dataset for Clustering", summary: "Grouping wines into three clusters by their chemical composition with Spectral Clustering.", zip: "files/projects/wine-dataset-for-clustering.zip", size: "6 MB", contents: ["Notebook", "README", "Dataset", "Checkpoints", "Images"] },
    { fields: ["Clustering"], title: "Galaxy Clustering", summary: "Unsupervised grouping of galaxies by their observed properties.", zip: "" },
    { fields: ["Regression"], title: "House Prices - Advanced Regression Techniques", summary: "Predicting house sale prices in Ames, Iowa with an ensemble of HuberRegressor and NGBoost whose weights are optimized using the Nelder–Mead method.", zip: "files/projects/house-prices-advanced-regression-techniques.zip", size: "7 MB", contents: ["Notebook", "README", "Dataset", "Checkpoints", "Images", "Submission"] },
    { fields: ["Classification"], title: "Credit Card Fraud Detection", summary: "Detecting fraud in highly imbalanced card transactions with an ensemble of a Deep Neural Network and XGBoost.", zip: "files/projects/credit-card-fraud-detection.zip", size: "76 MB", contents: ["Notebook", "README", "Dataset", "Checkpoints", "Images"] },
    { fields: ["Computer Vision", "Classification"], title: "Cats and Dogs Image Classification", summary: "Binary image classification with transfer learning on pretrained convolutional networks.", zip: "" }
];

// Experience entries in the order shown on the timeline; role is an optional label shown beside the title
const experience = [
    { title: "Intern at Abdul Rachman Saleh Airport", detail: "Monitoring and recording aircraft arrivals, departures, and ground time in the AMC unit" },
    { title: "Problem Setter PEMNAS UB 2025", role: "External Committee", detail: "High school level problems for a national mathematics competition at Universitas Brawijaya" },
    { title: "Problem Setter PEMNAS UB 2024", role: "Internal Committee", detail: "High school level problems for a national mathematics competition at Universitas Brawijaya" },
    { title: "Teaching Assistant", detail: "Matematika Dasar II+, Pengantar Persamaan Diferensial, and Pengantar Optimisasi++" }
];

// Skills with what each one is used for, shown as chips on its card
const skills = [
    { title: "Python", uses: ["Statistical Modeling", "Machine Learning", "Deep Learning", "Numerical Optimization"] },
    { title: "R", uses: ["Statistical Analysis", "Actuarial Modeling", "Data Visualization", "Forecasting"] },
    { title: "LaTeX", uses: ["Mathematical Writing", "Course Modules", "Competition Problem Sets"] }
];

// Certificates listed newest first; file is an image shown in the lightbox, a PDF, or a web page opened in a new tab, linkLabel overrides the default link text, items lists exams as a code and subject name, with the codes shown as one segmented pill beside the title, and an empty file hides the link
const certificates = [
    { title: "Kaggle Notebooks Expert", issuer: "Kaggle", file: "https://www.kaggle.com/reyhanksatria", linkLabel: "View profile" },
    { title: "ASAI Exams Passed", issuer: "Persatuan Aktuaris Indonesia (PAI)", items: [{ code: "A10", name: "Financial Mathematics" }, { code: "A20", name: "Probability and Statistics" }, { code: "A30", name: "Economics" }, { code: "A40", name: "Accounting" }, { code: "A60", name: "Actuarial Mathematics" }], file: "files/asai.png" },
    { title: "PEMNAS UB 2025 Problem Setting Team", issuer: "Universitas Brawijaya", file: "files/pemnas-2025.png" },
    { title: "PEMNAS UB 2024 Problem Setting Team", issuer: "Universitas Brawijaya", file: "files/pemnas-2024.png" },
    { title: "Finalist LMNas UGM 2021", issuer: "Universitas Gadjah Mada", file: "files/lmnas-2021.png" },
    { title: "Bronze Medal KMNR 2018", issuer: "Klinik Pendidikan MIPA (KPM)", file: "files/kmnr-2018.png" }
];

// Course list as [rank, name, credits, score, grade]; null score means the score is not available
const courses = [
    [1, "Matematika Dasar I+", 4, 94.63, "A"], [2, "Program Linear", 3, 93, "A"], [3, "Matematika Dasar II+", 4, 91.97, "A"],
    [4, "Statistika Matematika II+", 3, 91.28, "A"], [5, "Pengantar Proses Stokastik", 3, 87.8, "A"], [6, "Matematika Finansial I", 3, 87.35, "A"],
    [7, "Pemrograman++", 3, 85.39, "A"], [8, "Pengantar Persamaan Diferensial", 4, 85.3, "A"], [9, "Matematika Demografi", 2, 84.5, "A"],
    [10, "Teori Risiko Aktuaria", 2, 83.3, "A"], [11, "Praktek kerja Lapang (PKL)", 4, 83.17, "A"], [12, "Kewirausahaan", 2, 82.65, "A"], [13, "Tugas Akhir/ Skripsi", 6, 82.57, "A"],
    [14, "Matematika Aktuaria I", 3, 81.9, "A"], [15, "Pengantar Pembelajaran Mesin++", 3, 81.35, "A"], [16, "Persamaan Diferensial Numerik++", 3, 80.89, "A"],
    [17, "Pengantar Profesi Aktuaris", 2, 80.61, "A"], [null, "Agama Katolik", 2, null, "A"], [null, "Akuntansi Aktuaria I", 2, null, "A"],
    [null, "Analisis Regresi++", 3, null, "A"], [null, "Analitika Data II++", 2, null, "A"], [null, "Bahasa Indonesia", 2, null, "A"],
    [null, "Bahasa Inggris", 2, null, "A"], [null, "Kemipaan", 2, null, "A"], [null, "Kewarganegaraan", 2, null, "A"],
    [null, "Pancasila", 2, null, "A"], [null, "Pengabdian Kepada Masyarakat (PKM)", 4, null, "A"], [null, "Pengantar Aljabar Linear", 3, null, "A"],
    [null, "Pengantar Analisis Data Eksploratori+", 3, null, "A"], [null, "Pengantar Basis Data", 2, null, "A"], [null, "Pengantar Ekonomi Makro", 3, null, "A"],
    [null, "Pengantar Ekonomi Mikro", 3, null, "A"], [null, "Pengantar Metode Numerik++", 3, null, "A"], [null, "Pengantar Optimisasi++", 2, null, "A"],
    [null, "Praktikum Pemrograman", 1, null, "A"], [null, "Praktikum Pengantar Basis Data", 1, null, "A"], [null, "Statistika Dasar dan Probabilitas++", 3, null, "A"],
    [38, "Akuntansi Syariah", 2, 79.9, "B+"], [38, "Pengantar Teori Investasi", 3, 79.9, "B+"], [40, "Pemodelan Risiko Aktuaria", 3, 79.87, "B+"],
    [41, "Manajemen Aktuaria", 3, 78.62, "B+"], [42, "Pengantar Runtun Waktu", 3, 78.4, "B+"], [43, "Metode Penelitian dan Penulisan Ilmiah", 2, 78.23, "B+"],
    [44, "Asuransi Pertanian", 2, 77.48, "B+"], [45, "Ekonometrika", 2, 76.86, "B+"], [46, "Analisis Data Survival", 3, 76.4, "B+"],
    [47, "Simulasi Aktuaria", 2, 76.1, "B+"], [48, "Matematika Finansial II", 3, 75.83, "B+"], [49, "Statistika Matematika I+", 3, 75.36, "B+"],
    [50, "Matematika Aktuaria II", 3, 75.18, "B+"], [null, "Akuntansi Aktuaria II", 2, null, "B+"], [null, "Analitika Data I++", 3, null, "B+"],
    [null, "Model Linear", 3, null, "B+"], [null, "Statistika Nonparametrik", 3, null, "B+"]
];

// Weibull estimates from the thesis (MLE with BFGS) on NCCTG lung cancer lifetime data in days
const thesisFit = { k: 1.316840, tau: 417.758665, mae: 0.010237, patients: 228, censored: 63 };

// Kaplan–Meier estimates at the 139 observed event times as [day, survival], taken from the thesis appendix
const thesisKM = [
    [5, 0.995614], [11, 0.982456], [12, 0.97807], [13, 0.969298], [15, 0.964912], [26, 0.960526], [30, 0.95614], [31, 0.951754],
    [53, 0.942982], [54, 0.938596], [59, 0.934211], [60, 0.925439], [61, 0.921053], [62, 0.916667], [65, 0.907895], [71, 0.903509],
    [79, 0.899123], [81, 0.890351], [88, 0.881579], [92, 0.877193], [93, 0.872785], [95, 0.863969], [105, 0.859561], [107, 0.8507],
    [110, 0.846269], [116, 0.841838], [118, 0.837407], [122, 0.832977], [131, 0.828546], [132, 0.819684], [135, 0.815254], [142, 0.810823],
    [144, 0.806392], [145, 0.797531], [147, 0.7931], [153, 0.788669], [156, 0.779808], [163, 0.766516], [166, 0.757654], [167, 0.753224],
    [170, 0.748793], [175, 0.744309], [176, 0.739798], [177, 0.735287], [179, 0.726209], [180, 0.721671], [181, 0.712593], [182, 0.708054],
    [183, 0.703515], [186, 0.698947], [189, 0.694349], [194, 0.689689], [197, 0.684997], [199, 0.680273], [201, 0.670825], [202, 0.666101],
    [207, 0.661308], [208, 0.656516], [210, 0.651724], [212, 0.646897], [218, 0.642069], [222, 0.637205], [223, 0.632303], [226, 0.627285],
    [229, 0.622267], [230, 0.617248], [239, 0.607046], [245, 0.601858], [246, 0.596669], [267, 0.591342], [268, 0.586014], [269, 0.580687],
    [270, 0.57531], [283, 0.569778], [284, 0.564247], [285, 0.553073], [286, 0.547487], [288, 0.5419], [291, 0.536314], [293, 0.530608],
    [301, 0.524777], [303, 0.518881], [305, 0.512917], [306, 0.506953], [310, 0.495024], [320, 0.488987], [329, 0.482951], [337, 0.476837],
    [340, 0.470724], [345, 0.464611], [348, 0.458497], [350, 0.452384], [351, 0.446271], [353, 0.434044], [361, 0.427844], [363, 0.415442],
    [364, 0.409242], [371, 0.39665], [387, 0.390039], [390, 0.383428], [394, 0.376817], [426, 0.369966], [428, 0.363115], [429, 0.356263],
    [433, 0.349412], [442, 0.342561], [444, 0.33571], [450, 0.328716], [455, 0.321722], [457, 0.314728], [460, 0.307575], [473, 0.300422],
    [477, 0.293269], [519, 0.285749], [520, 0.27823], [524, 0.26319], [533, 0.255449], [550, 0.247467], [558, 0.239218], [567, 0.230674],
    [574, 0.222131], [583, 0.213587], [613, 0.204688], [624, 0.195788], [641, 0.186889], [643, 0.177989], [654, 0.16909], [655, 0.16019],
    [687, 0.151291], [689, 0.142392], [705, 0.133492], [707, 0.124593], [728, 0.115693], [731, 0.106794], [735, 0.097894], [765, 0.088105],
    [791, 0.078315], [814, 0.067127], [883, 0.050346]
];

// Lifetime data of 228 patients as [days, delta] where delta 1 is an observed event and 0 is right-censored
const thesisData = [
    [306, 1], [455, 1], [1010, 0], [210, 1], [883, 1], [1022, 0], [310, 1], [361, 1], [218, 1], [166, 1], [170, 1], [654, 1],
    [728, 1], [71, 1], [567, 1], [144, 1], [613, 1], [707, 1], [61, 1], [88, 1], [301, 1], [81, 1], [624, 1], [371, 1],
    [394, 1], [520, 1], [574, 1], [118, 1], [390, 1], [12, 1], [473, 1], [26, 1], [533, 1], [107, 1], [53, 1], [122, 1],
    [814, 1], [965, 0], [93, 1], [731, 1], [460, 1], [153, 1], [433, 1], [145, 1], [583, 1], [95, 1], [303, 1], [519, 1],
    [643, 1], [765, 1], [735, 1], [189, 1], [53, 1], [246, 1], [689, 1], [65, 1], [5, 1], [132, 1], [687, 1], [345, 1],
    [444, 1], [223, 1], [175, 1], [60, 1], [163, 1], [65, 1], [208, 1], [821, 0], [428, 1], [230, 1], [840, 0], [305, 1],
    [11, 1], [132, 1], [226, 1], [426, 1], [705, 1], [363, 1], [11, 1], [176, 1], [791, 1], [95, 1], [196, 0], [167, 1],
    [806, 0], [284, 1], [641, 1], [147, 1], [740, 0], [163, 1], [655, 1], [239, 1], [88, 1], [245, 1], [588, 0], [30, 1],
    [179, 1], [310, 1], [477, 1], [166, 1], [559, 0], [450, 1], [364, 1], [107, 1], [177, 1], [156, 1], [529, 0], [11, 1],
    [429, 1], [351, 1], [15, 1], [181, 1], [283, 1], [201, 1], [524, 1], [13, 1], [212, 1], [524, 1], [288, 1], [363, 1],
    [442, 1], [199, 1], [550, 1], [54, 1], [558, 1], [207, 1], [92, 1], [60, 1], [551, 0], [543, 0], [293, 1], [202, 1],
    [353, 1], [511, 0], [267, 1], [511, 0], [371, 1], [387, 1], [457, 1], [337, 1], [201, 1], [404, 0], [222, 1], [62, 1],
    [458, 0], [356, 0], [353, 1], [163, 1], [31, 1], [340, 1], [229, 1], [444, 0], [315, 0], [182, 1], [156, 1], [329, 1],
    [364, 0], [291, 1], [179, 1], [376, 0], [384, 0], [268, 1], [292, 0], [142, 1], [413, 0], [266, 0], [194, 1], [320, 1],
    [181, 1], [285, 1], [301, 0], [348, 1], [197, 1], [382, 0], [303, 0], [296, 0], [180, 1], [186, 1], [145, 1], [269, 0],
    [300, 0], [284, 0], [350, 1], [272, 0], [292, 0], [332, 0], [285, 1], [259, 0], [110, 1], [286, 1], [270, 1], [81, 1],
    [131, 1], [225, 0], [269, 1], [225, 0], [243, 0], [279, 0], [276, 0], [135, 1], [79, 1], [59, 1], [240, 0], [202, 0],
    [235, 0], [105, 1], [224, 0], [239, 1], [237, 0], [173, 0], [252, 0], [221, 0], [185, 0], [92, 0], [13, 1], [222, 0],
    [192, 0], [183, 1], [211, 0], [175, 0], [197, 0], [203, 0], [116, 1], [188, 0], [191, 0], [105, 0], [174, 0], [177, 0]
];

// BFGS iterates from the thesis notebook as [r, k_r, tau_r, f(x_r), gradient norm], ending at convergence in iteration 13
const bfgsPath = [
    [0, 1.000000, 421.775758, 1162.338176, 5.761870e+01], [1, 1.333296, 421.775758, 1153.883611, 2.375053e+00],
    [2, 1.320102, 421.769614, 1153.864889, 4.523303e-01], [3, 1.316978, 421.761707, 1153.864142, 9.597228e-03],
    [4, 1.316481, 421.707452, 1153.863817, 8.047533e-02], [5, 1.313243, 420.905549, 1153.860263, 5.564541e-01],
    [6, 1.311725, 419.664996, 1153.856176, 7.756437e-01], [7, 1.313017, 418.141771, 1153.852408, 5.713603e-01],
    [8, 1.315566, 417.640764, 1153.851318, 1.873301e-01], [9, 1.316717, 417.704031, 1153.851192, 1.757447e-02],
    [10, 1.316843, 417.753633, 1153.851188, 4.443220e-04], [11, 1.316841, 417.758536, 1153.851188, 8.587077e-05],
    [12, 1.316840, 417.758666, 1153.851188, 2.191153e-06], [13, 1.316840, 417.758665, 1153.851188, 1.449528e-08]
];

// Strong Wolfe line search trials per BFGS step r as [alpha, kind, phase, index] from the notebook run; phase "i" is the line search and "j" the zoom procedure, kind is reject (sufficient decrease fails), expand (met, alpha doubled), low (met, becomes alpha_low), or accept
const lineSearch = [
    [[1.0, "reject", "i", 1], [3.18203776916692e-20, "low", "j", 1], [0.652976717146994, "reject", "j", 2], [0.42126927641298145, "reject", "j", 3], [0.26615546950335034, "reject", "j", 4], [0.1613471087104767, "reject", "j", 5], [0.08711353465863132, "reject", "j", 6], [0.019540409925442093, "reject", "j", 7], [0.005784511204330557, "accept", "j", 8]],
    [[1.0, "accept", "i", 1]],
    [[1.0, "accept", "i", 1]],
    [[1.0, "expand", "i", 1], [2.0, "expand", "i", 2], [4.0, "expand", "i", 3], [8.0, "accept", "i", 4]],
    [[1.0, "accept", "i", 1]],
    [[1.0, "accept", "i", 1]],
    [[1.0, "accept", "i", 1]],
    [[1.0, "accept", "i", 1]],
    [[1.0, "accept", "i", 1]],
    [[1.0, "accept", "i", 1]],
    [[1.0, "accept", "i", 1]],
    [[1.0, "accept", "i", 1]],
    [[1.0, "accept", "i", 1]]
];

// Search directions p_r = [p_k, p_tau] per BFGS step from the notebook run
const searchDir = [
    [57.61869986376827, 5.312590645178972e-17],
    [-0.01319393463825487, -0.006143794068944008],
    [-0.0031242808727922327, -0.007906642306188937],
    [-6.209952935586566e-05, -0.0067818805225134705],
    [-0.0032378288341123867, -0.8019027154233666],
    [-0.0015178216660927681, -1.240552974464179],
    [0.0012911925363506174, -1.5232254961303957],
    [0.002549771516954944, -0.501006519185647],
    [0.0011507528760885796, 0.06326632336092217],
    [0.00012569859473758336, 0.049602340701762615],
    [-2.0269742861374594e-06, 0.004903225986427331],
    [-5.548139699417081e-07, 0.0001297482004373734],
    [-1.4752004765405682e-08, -6.154629712505703e-07]
];

// Gradients g_r = [g_k, g_tau] at each BFGS iterate from the notebook run
const bfgsGrad = [
    [-57.61869986376827, -5.312590645178972e-17], [2.3750444274843177, 0.0063970414331080225],
    [0.45228456496210406, 0.006434532669668078], [-0.007125774271782459, 0.006428850538205873],
    [-0.08022485120110184, 0.006344450360644727], [-0.5564308585624518, 0.005089486391918037],
    [-0.7756373622593922, 0.003128570874384687], [-0.5713598651218189, 0.0006671961237263927],
    [-0.18732999104425568, -0.00017804222639267284], [-0.017574249888777926, -8.811790909985244e-05],
    [0.0004442448573581115, -8.281355060744218e-06], [8.587048874575398e-05, -2.1841255469349542e-07],
    [2.191152667141427e-06, 8.957371105695194e-10], [1.4495150746363095e-08, 6.198407672547424e-11]
];

// Hessian approximations B_r as [B_11, B_12, B_22] at each BFGS iterate from the notebook run, starting from the identity
const bfgsB = [
    [1.0, 0.0, 1.0], [180.00138496071074, 0.019193273085613943, 1.0000020465494297],
    [145.94846218880073, -0.46788810275516596, 0.9986978307507615], [153.25555512968046, -2.4540202472247965, 0.9704158041034298],
    [282.7439452515621, -1.2416734981145694, 0.0129252294773951], [370.40278982757127, -0.9017238773113321, 0.005205857841358014],
    [331.16859726369364, -0.22848550138042983, 0.0018602315333719837], [237.2474633474513, 0.06699904712993612, 0.0016726895832085888],
    [160.1271357024762, 0.04841800395654086, 0.0019334941970212869], [148.764271535491, -0.022684614767657152, 0.0018339725910369747],
    [153.980691802472, -0.026947555523362365, 0.001677820496423498], [152.41585601687285, -0.010081392902249464, 0.0016402482374125828],
    [148.87946556602125, -0.008315558528517286, 0.0016547027476566051], [148.06678500955343, -0.012388066674416796, 0.0016516052277478347]
];

// Machine Learning Bundle shown on bundle.html; every tier appears on the bundle ladder, tiers with available set to false show as coming soon without a price, files describes the folder shown in the explorer, a project with an empty tier shows no bundle badge, and a project may carry an optional summary shown under its title in the catalogue drawer
const bundle = {
    whatsapp: "6289603017924",
    tiers: [
        { name: "Basic", projects: 10, price: 99000, available: true, includes: ["10 complete project folders", "A structured README for every project", "Access to the Google Drive folder"] },
        { name: "Standard", projects: 20, price: 149000, available: true, best: true, includes: ["Everything in Basic", "10 additional project folders", "A structured README for every project", "Access to the Google Drive folder"] },
        { name: "Pro", projects: 40, price: 249000, available: false },
        { name: "Premium", projects: 60, price: 399000, available: false },
        { name: "Ultimate", projects: 100, price: 599000, available: false }
    ],
    features: [
        { title: "Complete Pipeline", text: "Every stage in order, from loading and checking the data to the final model and a written conclusion." },
        { title: "Model Comparison", text: "A simple baseline first, then many algorithms compared side by side, before and after tuning." },
        { title: "Ensemble Modeling", text: "In most projects, the best models are combined through weighted voting or stacking, then compared against the best single model." },
        { title: "Model Interpretation", text: "SHAP for tabular data, LIME for text, and Grad-CAM for images reveal what each prediction relies on." },
        { title: "Reproducible Results", text: "Fixed seeds, locked even tighter in deep learning projects, make every Run All give the same results, and most projects include checkpoints to skip long training." },
        { title: "Clear Narration", text: "Each stage opens with what it does and why, and almost every output is followed by an Insight cell that explains it with the actual numbers." }
    ],
    projects: [
        { title: "Jellyfish Image Classification", fields: ["Computer Vision", "Classification"], tier: "" },
        { title: "Cats and Dogs Image Classification", fields: ["Computer Vision", "Classification"], tier: "" },
        { title: "Apples or Tomatoes - Image Classification", fields: ["Computer Vision", "Classification"], tier: "" },
        { title: "Digit Recognizer", fields: ["Computer Vision", "Classification"], tier: "" },
        { title: "Tweet Emotions", fields: ["NLP", "Classification"], tier: "" },
        { title: "Fake News Classification", fields: ["NLP", "Classification"], tier: "" },
        { title: "Hate Speech and Offensive Language Detection", fields: ["NLP", "Classification"], tier: "" },
        { title: "Daily Climate Time Series Data", fields: ["Time Series"], tier: "" },
        { title: "Galaxy Clustering", fields: ["Clustering"], tier: "" },
        { title: "Wine Dataset for Clustering", fields: ["Clustering"], tier: "" },
        { title: "House Prices - Advanced Regression Techniques", fields: ["Regression"], tier: "" },
        { title: "Salary Prediction", fields: ["Regression"], tier: "" },
        { title: "Credit Card Fraud Detection", fields: ["Classification"], tier: "" },
        { title: "Lung Cancer Prediction", fields: ["Classification"], tier: "" },
        { title: "Student Burnout & Dropout Risk", fields: ["Classification"], tier: "" },
        { title: "Medical Student Mental Health", fields: ["Classification"], tier: "" },
        { title: "Spaceship Titanic", fields: ["Classification"], tier: "" },
        { title: "Titanic - Machine Learning from Disaster", fields: ["Classification"], tier: "" },
        { title: "Predicting Student Health Risk", fields: ["Classification"], tier: "" },
        { title: "Weather Prediction", fields: ["Classification"], tier: "" }
    ],
    files: [
        { name: "Project Notebook.ipynb", icon: "notebook", text: "The whole project in one notebook. It opens with a map of every stage and closes with lessons learned, limitations, and exercises to try." },
        { name: "README.md", icon: "doc", text: "Most READMEs follow the same structure, so you can find any information quickly.", sections: [
            { title: "Overview", text: "What the project builds, the data behind it, and what the notebook focuses on." },
            { title: "Difficulty Rating", text: "Scores out of 10 for each aspect, plus an overall level.", tags: ["Data", "Modeling", "Code", "Concept Depth", "Overall"] },
            { title: "Results Summary", text: "A table of the final model, its main scores, and supporting details like the number of models tested or features used." },
            { title: "Folder Structure", text: "A full map of every file in the project folder." },
            { title: "Tools and Libraries", text: "Each library used and what it is used for." },
            { title: "How to Run", text: "Steps to set up and run the notebook from start to finish." },
            { title: "Workflow", text: "Every stage of the notebook in order, each explained in a sentence." },
            { title: "Key Findings", text: "The most important results and what they reveal about the data and model." },
            { title: "Notes", text: "Honest limitations of the approach and the results." },
            { title: "Data Source", text: "Where the dataset comes from and its license." }
        ] },
        { name: "images", icon: "folder", text: "Every chart from the notebook is saved here in high resolution. Below are some of the most common types.", charts: [{ title: "Distribution", kind: "hist" }, { title: "Correlation Heatmap", kind: "heat" }, { title: "Scatter Plot", kind: "scatter" }, { title: "Learning Curve", kind: "curve" }, { title: "Confusion Matrix", kind: "matrix" }, { title: "SHAP Plot", kind: "shap" }, { title: "Box Plot", kind: "box" }, { title: "Actual vs Predicted", kind: "fit" }, { title: "Time Series Plot", kind: "series" }] },
        { name: "checkpoints", icon: "folder", text: "Most projects keep their saved models and tuning results here, so Run All never repeats long training.", flow: true, items: [
            { name: "Trained Models", icon: "trained", ext: [".keras", ".pkl"], text: "Baseline, tuned, and final models, ready to load." },
            { name: "Training Histories", icon: "history", ext: [".pkl"], text: "Loss and metrics per epoch, used to draw the learning curves." },
            { name: "Tuning Results", icon: "tune", ext: [".joblib"], text: "The best hyperparameters found during tuning, along with the search results." },
            { name: "Thresholds", icon: "threshold", ext: [".joblib"], text: "Tuned cutoff values, such as decision or feature selection thresholds, chosen to maximize the main metric." },
            { name: "Experiment Results", icon: "result", ext: [".pkl"], text: "Saved outputs of longer steps such as cross-validation, ensembles, or feature selection." },
            { name: "Preprocessors", icon: "prep", ext: [".pkl"], text: "Fitted tools such as tokenizers, so every input is processed exactly like the training data." }
        ] },
        { name: "Dataset", icon: "folder", text: "All the data used in the notebook, stored in a folder that carries the project's name.", items: [
            { name: "Tabular Data", icon: "table", ext: [".csv"], text: "Rows and columns ready to load with pandas." },
            { name: "Image Folders", icon: "image", ext: [".jpg", ".jpeg"], text: "Image files grouped either by class or by data split, depending on the dataset." },
            { name: "Ready-Made Splits", icon: "split", text: "Some datasets already come with separate train, validation, and test sets from the source." },
            { name: "Source and License", icon: "source", text: "The README credits where the data comes from and the license it uses." }
        ] },
        { name: "Extra Files", icon: "extra", text: "Some projects also include files specific to their task.", items: [{ name: "submission", icon: "sheet", text: "The final predictions, saved in the format required for a competition submission." }, { name: "Pretrained Model", icon: "model", text: "Ready-made weights that some projects build on, such as GloVe word embeddings." }] }
    ],
    steps: [
        { title: "Pick What You Need", text: "Compare the bundles above and choose what fits your learning goals." },
        { title: "Chat on WhatsApp", text: "Press a buy button to open a ready message for your choice." },
        { title: "Make the Payment", text: "Pay with the instructions you receive and share your Gmail address." },
        { title: "Get Access", text: "Your Gmail gets access to the Google Drive folder of every bundle you buy." }
    ],
    faq: [
        { q: "What do I need to run the notebooks?", a: "Python 3.10 or newer with Jupyter Notebook, JupyterLab, or VS Code. Just click Run All and every cell runs in order, with the extra libraries installed automatically." },
        { q: "How are the files delivered?", a: "Once your payment is confirmed, your Gmail gets access to the Google Drive folder of every bundle you buy." },
        { q: "Can I try a project before buying?", a: "Yes. Each field has a free sample on the main site that you can download as a complete project folder." },
        { q: "What language are the notebooks written in?", a: "Every explanation and code comment is written in Indonesian, while the code itself is written in English." },
        { q: "Can I upgrade to a bigger bundle later?", a: "Yes. Just pay the price difference between the two bundles and your Gmail gets access to the new bundle." },
        { q: "Do I need a GPU?", a: "No. Every project, including the deep learning ones, was built and run entirely on a laptop CPU. Most projects also include saved checkpoints, so you can skip the long training steps." },
        { q: "Will my bundle get updates?", a: "Each bundle keeps its own set of projects, but new supporting files such as guides or coding exercises may be added to your folder over time at no extra cost." }
    ]
};