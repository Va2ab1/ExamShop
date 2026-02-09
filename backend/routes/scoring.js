import express from 'express';
import { getDatabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { recordFlagSubmission, getUserStats, getLeaderboard, getChallengeStats } from '../utils/scorer.js';

const router = express.Router();

// Submit a flag
router.post('/submit', authenticateToken, (req, res) => {
  try {
    const { challenge_id, flag, solve_time_seconds } = req.body;

    if (!challenge_id || !flag) {
      return res.status(400).json({ error: 'Challenge ID and flag required' });
    }

    // Get hints and solution views from request (normally tracked separately)
    const hints_used = req.body.hints_used || 0;
    const solution_viewed = req.body.solution_viewed || false;

    const result = recordFlagSubmission(
      req.user.id,
      challenge_id,
      flag,
      hints_used,
      solution_viewed,
      solve_time_seconds
    );

    if (!result.success) {
      if (result.alreadySolved) {
        return res.status(400).json({ 
          error: result.error,
          alreadySolved: true
        });
      }
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: 'Flag accepted! Challenge solved!',
      score: result.score,
      hints_used: result.hintsUsed,
      solution_viewed: result.solutionViewed,
      has_group_penalty: result.hasGroupPenalty
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get all challenges
router.get('/challenges', (req, res) => {
  try {
    const db = getDatabase();
    const challenges = db.prepare(`
      SELECT id, name, description, category, difficulty, base_score
      FROM challenges
      ORDER BY difficulty, id
    `).all();

    // Group by category
    const categories = {};
    for (const challenge of challenges) {
      if (!categories[challenge.category]) {
        categories[challenge.category] = [];
      }
      categories[challenge.category].push(challenge);
    }

    res.json({
      challenges,
      categories,
      total: challenges.length
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get specific challenge details
router.get('/challenges/:id', (req, res) => {
  try {
    const db = getDatabase();
    const challengeId = req.params.id;

    const challenge = db.prepare(`
      SELECT id, name, description, category, difficulty, base_score
      FROM challenges
      WHERE id = ?
    `).get(challengeId);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Get stats
    const stats = getChallengeStats(challengeId);

    res.json({
      challenge,
      stats
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get hint for a challenge
router.post('/hint', authenticateToken, (req, res) => {
  try {
    const { challenge_id } = req.body;

    if (!challenge_id) {
      return res.status(400).json({ error: 'Challenge ID required' });
    }

    const db = getDatabase();
    const challenge = db.prepare(`
      SELECT hint_text FROM challenges WHERE id = ?
    `).get(challenge_id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json({
      hint: challenge.hint_text,
      penalty: '20% score reduction',
      message: 'Each hint reduces your score by 20%'
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// View solution for a challenge
router.post('/solution-view', authenticateToken, (req, res) => {
  try {
    const { challenge_id } = req.body;

    if (!challenge_id) {
      return res.status(400).json({ error: 'Challenge ID required' });
    }

    const db = getDatabase();
    const challenge = db.prepare(`
      SELECT solution_text FROM challenges WHERE id = ?
    `).get(challenge_id);

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json({
      solution: challenge.solution_text,
      penalty: '50% score reduction',
      message: 'Viewing the solution reduces your score by 50%'
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get leaderboard
router.get('/leaderboard', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = getLeaderboard(limit);

    res.json({
      leaderboard,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get user's stats
router.get('/stats/:userId', (req, res) => {
  try {
    const userId = req.params.userId;
    const stats = getUserStats(userId);

    const db = getDatabase();
    const user = db.prepare('SELECT username, role FROM users WHERE id = ?').get(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get solved challenges
    const solvedChallenges = db.prepare(`
      SELECT s.*, c.name, c.category, c.difficulty
      FROM scoring s
      JOIN challenges c ON s.challenge_id = c.id
      WHERE s.user_id = ?
      ORDER BY s.solved_at DESC
    `).all(userId);

    res.json({
      user: {
        id: userId,
        username: user.username,
        role: user.role
      },
      stats,
      solvedChallenges
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Get current user's progress
router.get('/my-progress', authenticateToken, (req, res) => {
  try {
    const stats = getUserStats(req.user.id);

    const db = getDatabase();
    
    // Get solved challenges
    const solvedChallenges = db.prepare(`
      SELECT s.*, c.name, c.category, c.difficulty
      FROM scoring s
      JOIN challenges c ON s.challenge_id = c.id
      WHERE s.user_id = ?
      ORDER BY s.solved_at DESC
    `).all(req.user.id);

    // Get all challenges to show progress
    const allChallenges = db.prepare('SELECT COUNT(*) as count FROM challenges').get();
    
    const progress = (stats.challenges_solved / allChallenges.count) * 100;

    res.json({
      stats,
      solvedChallenges,
      totalChallenges: allChallenges.count,
      progress: progress.toFixed(1) + '%'
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

// Rate a challenge (feedback)
router.post('/rate', authenticateToken, (req, res) => {
  try {
    const { challenge_id, rating, feedback } = req.body;

    if (!challenge_id || !rating) {
      return res.status(400).json({ error: 'Challenge ID and rating required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // In a real app, we'd store this in a ratings table
    // For now, just acknowledge
    res.json({
      message: 'Thank you for your feedback!',
      challenge_id,
      rating,
      feedback
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

export default router;
