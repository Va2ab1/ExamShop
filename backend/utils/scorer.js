import { getDatabase } from '../config/database.js';

// Scoring system for ExamShop challenges
// Base scores: ⭐=100, ⭐⭐=250, ⭐⭐⭐=500
// Penalties: Hint=-20%, Solution=-50%, Group=-30% (same flag within 5min)
// Bonus: Speed=+10% if faster than median

export function calculateScore(challengeId, hintsUsed, solutionViewed, solveTimeSeconds) {
  const db = getDatabase();
  
  // Get challenge base score
  const challenge = db.prepare('SELECT base_score, difficulty FROM challenges WHERE id = ?').get(challengeId);
  
  if (!challenge) {
    return 0;
  }
  
  let score = challenge.base_score;
  
  // Apply hint penalty: -20% per hint
  if (hintsUsed > 0) {
    const hintPenalty = score * 0.20 * hintsUsed;
    score -= hintPenalty;
  }
  
  // Apply solution viewed penalty: -50%
  if (solutionViewed) {
    score = score * 0.5;
  }
  
  // Apply speed bonus: +10% if faster than median
  const medianTime = getMedianSolveTime(challengeId);
  if (medianTime && solveTimeSeconds && solveTimeSeconds < medianTime) {
    score = score * 1.10;
  }
  
  // Round to nearest integer
  return Math.max(0, Math.round(score));
}

export function checkGroupPenalty(userId, challengeId) {
  const db = getDatabase();
  
  // Get user's institution/group (for now, we'll use a simple time-based check)
  // Check if someone else submitted the same flag within 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const recentSubmissions = db.prepare(`
    SELECT COUNT(*) as count 
    FROM scoring 
    WHERE challenge_id = ? 
    AND user_id != ? 
    AND solved_at > ?
  `).get(challengeId, userId, fiveMinutesAgo);
  
  // If others submitted recently, apply 30% penalty
  return recentSubmissions.count > 0;
}

export function applyGroupPenalty(score) {
  return Math.round(score * 0.70); // 30% penalty
}

export function getMedianSolveTime(challengeId) {
  const db = getDatabase();
  
  const times = db.prepare(`
    SELECT submission_time_seconds 
    FROM scoring 
    WHERE challenge_id = ? 
    AND submission_time_seconds IS NOT NULL
    ORDER BY submission_time_seconds
  `).all(challengeId);
  
  if (times.length === 0) {
    return null;
  }
  
  const middle = Math.floor(times.length / 2);
  if (times.length % 2 === 0) {
    return (times[middle - 1].submission_time_seconds + times[middle].submission_time_seconds) / 2;
  } else {
    return times[middle].submission_time_seconds;
  }
}

export function recordFlagSubmission(userId, challengeId, flagSubmitted, hintsUsed, solutionViewed, solveTimeSeconds) {
  const db = getDatabase();
  
  // Check if already solved
  const existing = db.prepare(`
    SELECT id FROM scoring WHERE user_id = ? AND challenge_id = ?
  `).get(userId, challengeId);
  
  if (existing) {
    return { success: false, error: 'Challenge already solved', alreadySolved: true };
  }
  
  // Verify flag is correct
  const challenge = db.prepare('SELECT flag FROM challenges WHERE id = ?').get(challengeId);
  
  if (!challenge) {
    return { success: false, error: 'Challenge not found' };
  }
  
  if (flagSubmitted.trim() !== challenge.flag) {
    return { success: false, error: 'Incorrect flag' };
  }
  
  // Calculate score
  let score = calculateScore(challengeId, hintsUsed, solutionViewed, solveTimeSeconds);
  
  // Check group penalty
  const hasGroupPenalty = checkGroupPenalty(userId, challengeId);
  if (hasGroupPenalty) {
    score = applyGroupPenalty(score);
  }
  
  // Record the submission
  try {
    db.prepare(`
      INSERT INTO scoring (user_id, challenge_id, flag_submitted, score, hints_used, solution_viewed, submission_time_seconds)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, challengeId, flagSubmitted, score, hintsUsed, solutionViewed || 0, solveTimeSeconds);
    
    return {
      success: true,
      score,
      hasGroupPenalty,
      hintsUsed,
      solutionViewed: solutionViewed || false
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function getUserStats(userId) {
  const db = getDatabase();
  
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as challenges_solved,
      SUM(score) as total_score,
      SUM(hints_used) as total_hints_used,
      SUM(solution_viewed) as total_solutions_viewed
    FROM scoring
    WHERE user_id = ?
  `).get(userId);
  
  const challengeBreakdown = db.prepare(`
    SELECT c.category, COUNT(*) as count, SUM(s.score) as category_score
    FROM scoring s
    JOIN challenges c ON s.challenge_id = c.id
    WHERE s.user_id = ?
    GROUP BY c.category
  `).all(userId);
  
  return {
    ...stats,
    challengeBreakdown
  };
}

export function getLeaderboard(limit = 10) {
  const db = getDatabase();
  
  const leaderboard = db.prepare(`
    SELECT 
      u.id,
      u.username,
      COUNT(s.id) as challenges_solved,
      SUM(s.score) as total_score,
      MAX(s.solved_at) as last_solve
    FROM users u
    LEFT JOIN scoring s ON u.id = s.user_id
    WHERE u.role = 'student'
    GROUP BY u.id, u.username
    HAVING total_score > 0
    ORDER BY total_score DESC, challenges_solved DESC, last_solve ASC
    LIMIT ?
  `).all(limit);
  
  return leaderboard;
}

export function recordHintUsage(userId, challengeId) {
  const db = getDatabase();
  
  // We'll track this in a temporary way or just return success
  // In a real implementation, you'd track this before submission
  return { success: true };
}

export function recordSolutionView(userId, challengeId) {
  const db = getDatabase();
  
  // Track solution views
  return { success: true };
}

export function getChallengeStats(challengeId) {
  const db = getDatabase();
  
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_solves,
      AVG(score) as average_score,
      AVG(submission_time_seconds) as average_time,
      MIN(solved_at) as first_solve,
      MAX(solved_at) as last_solve
    FROM scoring
    WHERE challenge_id = ?
  `).get(challengeId);
  
  return stats;
}

export default {
  calculateScore,
  checkGroupPenalty,
  applyGroupPenalty,
  getMedianSolveTime,
  recordFlagSubmission,
  getUserStats,
  getLeaderboard,
  recordHintUsage,
  recordSolutionView,
  getChallengeStats
};
