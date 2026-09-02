/**
 * Matching Service - modular similarity algorithm
 * Compares topic/category, keywords, technologies, skills, currentProblem
 * Returns percentage + reasons
 * Prioritizes available/active users
 * Can be replaced with AI-based matching later
 */

export const calculateSimilarity = (userA, userB) => {
  let score = 0;
  let maxScore = 0;
  const factors = [];

  const compareArrays = (arr1, arr2, weight) => {
    if (!arr1?.length || !arr2?.length) return { score: 0, maxScore: weight, matches: [] };
    const set1 = new Set(arr1.map(s => s.toLowerCase().trim()).filter(Boolean));
    const set2 = new Set(arr2.map(s => s.toLowerCase().trim()).filter(Boolean));
    if (set1.size === 0 || set2.size === 0) return { score: 0, maxScore: weight, matches: [] };
    const intersection = [...set1].filter(x => set2.has(x));
    const union = new Set([...set1, ...set2]);
    const similarity = intersection.length / union.size;
    return { score: similarity * weight, maxScore: weight, matches: intersection };
  };

  const compareStrings = (str1, str2, weight) => {
    if (!str1 || !str2) return { score: 0, maxScore: weight, matches: [] };
    const tokenize = s => new Set(s.toLowerCase().split(/[\s,.;:!?()]+/).filter(w => w.length > 2));
    const words1 = tokenize(str1);
    const words2 = tokenize(str2);
    if (words1.size === 0 || words2.size === 0) return { score: 0, maxScore: weight, matches: [] };
    const intersection = [...words1].filter(x => words2.has(x));
    const union = new Set([...words1, ...words2]);
    const similarity = intersection.length / union.size;
    return { score: similarity * weight, maxScore: weight, matches: intersection };
  };

  // Weighted categories - total 100
  const categoryResult = compareStrings(userA.category, userB.category, 25);
  score += categoryResult.score; maxScore += categoryResult.maxScore;
  if (categoryResult.matches.length) factors.push({ factor: 'Similar topic', matches: [...categoryResult.matches].slice(0,3) });

  const techResult = compareArrays(userA.technologies, userB.technologies, 25);
  score += techResult.score; maxScore += techResult.maxScore;
  if (techResult.matches.length) factors.push({ factor: 'Same technology', matches: [...techResult.matches] });

  const skillsResult = compareArrays(userA.skills, userB.skills, 15);
  score += skillsResult.score; maxScore += skillsResult.maxScore;
  if (skillsResult.matches.length) factors.push({ factor: 'Matching skills', matches: [...skillsResult.matches] });

  const titleResult = compareStrings(userA.title, userB.title, 10);
  score += titleResult.score; maxScore += titleResult.maxScore;
  if (titleResult.matches.length) factors.push({ factor: 'Similar project', matches: [...titleResult.matches].slice(0,3) });

  const problemResult = compareStrings(userA.currentProblem, userB.currentProblem, 15);
  score += problemResult.score; maxScore += problemResult.maxScore;
  if (problemResult.matches.length) factors.push({ factor: 'Similar problem', matches: [...problemResult.matches].slice(0,5) });

  const descResult = compareStrings(userA.description, userB.description, 10);
  score += descResult.score; maxScore += descResult.maxScore;
  if (descResult.matches.length && factors.length < 4) factors.push({ factor: 'Similar description', matches: [...descResult.matches].slice(0,5) });

  let percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  // Availability boost: prioritize Available users
  // Slight boost for Available, penalty for Not available
  // We handle sorting separately but also adjust score slightly
  // Keep percentage bounded

  return {
    percentage: Math.min(percentage, 100),
    factors: factors.filter(f => f.matches.length > 0)
  };
};

const availabilityRank = (availability) => {
  if (availability === 'Available') return 2;
  if (availability === 'Sometimes available') return 1;
  return 0;
};

const isRecentlyActive = (lastActive) => {
  if (!lastActive) return false;
  const diff = Date.now() - new Date(lastActive).getTime();
  return diff < 7 * 24 * 60 * 60 * 1000; // 7 days
};

export const findMatches = async (currentUser, currentProject, allUsers, allProjects, connectionsMap = new Map()) => {
  const matches = [];

  for (const user of allUsers) {
    if (user._id.toString() === currentUser._id.toString()) continue;

    // Respect anonymous mode? Matching still runs but output will be anonymized
    const userProjects = allProjects.filter(p => {
      if (p.owner.toString() !== user._id.toString()) return false;
      if (p.status !== 'Active') return false;
      // Privacy: Private projects never appear
      if (p.visibility === 'Private') return false;
      // Connections Only: only if currentUser is connected to that user
      if (p.visibility === 'Connections Only') {
        const key1 = `${currentUser._id}-${user._id}`;
        const key2 = `${user._id}-${currentUser._id}`;
        if (!connectionsMap.has(key1) && !connectionsMap.has(key2)) return false;
      }
      return true;
    });

    for (const project of userProjects) {
      const similarity = calculateSimilarity(
        {
          category: currentProject.category,
          title: currentProject.title,
          description: currentProject.description,
          technologies: currentProject.technologies,
          skills: currentUser.skills || [],
          currentProblem: currentProject.currentProblem
        },
        {
          category: project.category,
          title: project.title,
          description: project.description,
          technologies: project.technologies,
          skills: user.skills || [],
          currentProblem: project.currentProblem
        }
      );

      if (similarity.percentage >= 20) {
        // Prepare user object respecting anonymousMode
        let publicUser;
        if (user.anonymousMode) {
          const anonId = user._id.toString().slice(-4);
          publicUser = {
            _id: user._id,
            name: `Anonymous User #${anonId}`,
            bio: '',
            skills: user.skills,
            interests: user.interests,
            availability: user.activityVisibility ? user.availability : undefined,
            anonymousMode: true,
            lastActive: user.activityVisibility ? user.lastActive : undefined,
            profilePicture: ''
          };
        } else {
          publicUser = {
            _id: user._id,
            name: user.name,
            bio: user.bio,
            skills: user.skills,
            interests: user.interests,
            availability: user.availability,
            anonymousMode: false,
            lastActive: user.activityVisibility ? user.lastActive : undefined,
            profilePicture: user.profilePicture
          };
        }

        // For anonymous, hide detailed project info? Show general topic, skills, problem category
        let publicProject;
        if (user.anonymousMode) {
          publicProject = {
            _id: project._id,
            title: project.category, // only general topic
            description: '',
            category: project.category,
            technologies: project.technologies?.slice(0,2) || [],
            currentProblem: project.currentProblem ? project.category : '',
            status: project.status,
            visibility: project.visibility
          };
        } else {
          publicProject = {
            _id: project._id,
            title: project.title,
            description: project.description,
            category: project.category,
            technologies: project.technologies,
            currentProblem: project.currentProblem,
            status: project.status,
            visibility: project.visibility
          };
        }

        const availScore = availabilityRank(user.availability);
        const recent = isRecentlyActive(user.lastActive) ? 5 : 0;

        matches.push({
          user: publicUser,
          project: publicProject,
          matchPercentage: similarity.percentage,
          matchFactors: similarity.factors,
          _sortScore: similarity.percentage + availScore * 3 + recent,
          _availabilityRank: availScore
        });
      }
    }
  }

  // Sort: primary by sortScore, then percentage
  matches.sort((a, b) => b._sortScore - a._sortScore || b.matchPercentage - a.matchPercentage);
  // Remove temp fields before return? Keep but frontend can ignore
  return matches.map(({ _sortScore, _availabilityRank, ...rest }) => rest);
};
