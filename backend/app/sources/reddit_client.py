import praw
from typing import List, Dict, Any
from app.config import get_settings
import asyncio

settings = get_settings()

class RedditSource:
    def __init__(self):
        if not settings.REDDIT_CLIENT_ID or not settings.REDDIT_CLIENT_SECRET:
            # We will allow it to be None for fallback
            self.reddit = None
            return
            
        self.reddit = praw.Reddit(
            client_id=settings.REDDIT_CLIENT_ID,
            client_secret=settings.REDDIT_CLIENT_SECRET,
            user_agent=settings.REDDIT_USER_AGENT
        )

    async def search_submissions(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        if not self.reddit:
            return []
            
        def _search():
            # Search all subreddits
            submissions = self.reddit.subreddit("all").search(query, limit=limit, sort="relevance")
            results = []
            for sub in submissions:
                results.append({
                    "id": sub.id,
                    "title": sub.title,
                    "url": sub.url,
                    "selftext": sub.selftext,
                    "score": sub.score,
                    "num_comments": sub.num_comments,
                    "created_utc": sub.created_utc,
                    "subreddit": sub.subreddit.display_name
                })
            return results
            
        return await asyncio.to_thread(_search)

    async def get_comments(self, submission_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        if not self.reddit:
            return []
            
        def _get_comments():
            submission = self.reddit.submission(id=submission_id)
            submission.comment_sort = "top"
            submission.comments.replace_more(limit=0)
            
            comments = []
            for comment in submission.comments[:limit]:
                comments.append({
                    "id": comment.id,
                    "body": comment.body,
                    "score": comment.score,
                    "created_utc": comment.created_utc
                })
            return comments
            
        return await asyncio.to_thread(_get_comments)
