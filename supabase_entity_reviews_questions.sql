-- Reviews (star rating + comment) and Q&A for tracks and races.
-- Run in Supabase SQL editor. Adjust auth if your project uses different patterns.

-- ---------- REVIEWS ----------
CREATE TABLE IF NOT EXISTS entity_reviews (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('track', 'race')),
  entity_id BIGINT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_reviews_entity ON entity_reviews (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_reviews_created ON entity_reviews (created_at DESC);

CREATE TABLE IF NOT EXISTS entity_review_upvotes (
  review_id BIGINT NOT NULL REFERENCES entity_reviews (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (review_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_review_upvotes_review ON entity_review_upvotes (review_id);

-- ---------- QUESTIONS & ANSWERS ----------
CREATE TABLE IF NOT EXISTS entity_questions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('track', 'race')),
  entity_id BIGINT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entity_questions_entity ON entity_questions (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_questions_created ON entity_questions (created_at DESC);

CREATE TABLE IF NOT EXISTS entity_question_upvotes (
  question_id BIGINT NOT NULL REFERENCES entity_questions (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (question_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_question_upvotes_q ON entity_question_upvotes (question_id);

CREATE TABLE IF NOT EXISTS entity_answers (
  id BIGSERIAL PRIMARY KEY,
  question_id BIGINT NOT NULL REFERENCES entity_questions (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entity_answers_question ON entity_answers (question_id);
CREATE INDEX IF NOT EXISTS idx_entity_answers_created ON entity_answers (created_at DESC);

CREATE TABLE IF NOT EXISTS entity_answer_upvotes (
  answer_id BIGINT NOT NULL REFERENCES entity_answers (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (answer_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_entity_answer_upvotes_answer ON entity_answer_upvotes (answer_id);

-- ---------- RLS ----------
ALTER TABLE entity_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_review_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_question_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_answer_upvotes ENABLE ROW LEVEL SECURITY;

-- Reviews: public read, users insert/update own
CREATE POLICY "entity_reviews_select_all" ON entity_reviews FOR SELECT USING (true);
CREATE POLICY "entity_reviews_insert_own" ON entity_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "entity_reviews_update_own" ON entity_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "entity_reviews_delete_own" ON entity_reviews FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "entity_review_upvotes_select_all" ON entity_review_upvotes FOR SELECT USING (true);
CREATE POLICY "entity_review_upvotes_insert_own" ON entity_review_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "entity_review_upvotes_delete_own" ON entity_review_upvotes FOR DELETE USING (auth.uid() = user_id);

-- Questions & answers
CREATE POLICY "entity_questions_select_all" ON entity_questions FOR SELECT USING (true);
CREATE POLICY "entity_questions_insert_own" ON entity_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "entity_questions_delete_own" ON entity_questions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "entity_question_upvotes_select_all" ON entity_question_upvotes FOR SELECT USING (true);
CREATE POLICY "entity_question_upvotes_insert_own" ON entity_question_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "entity_question_upvotes_delete_own" ON entity_question_upvotes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "entity_answers_select_all" ON entity_answers FOR SELECT USING (true);
CREATE POLICY "entity_answers_insert_own" ON entity_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "entity_answers_delete_own" ON entity_answers FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "entity_answer_upvotes_select_all" ON entity_answer_upvotes FOR SELECT USING (true);
CREATE POLICY "entity_answer_upvotes_insert_own" ON entity_answer_upvotes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "entity_answer_upvotes_delete_own" ON entity_answer_upvotes FOR DELETE USING (auth.uid() = user_id);
