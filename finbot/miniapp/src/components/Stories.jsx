import { useState } from 'react';
import { haptic } from '../lib/telegram.js';

export default function Stories({ stories, onOpen }) {
  if (!stories?.length) return null;

  return (
    <div className="stories">
      {stories.map((story, index) => (
        <button
          key={story.id}
          className={`story story--${story.tone || 'info'}`}
          onClick={() => {
            haptic('light');
            onOpen(index);
          }}
        >
          <span className="story__ring">{story.emoji}</span>
          <span className="story__label">{story.title}</span>
        </button>
      ))}
    </div>
  );
}

export function StoryViewer({ stories, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const story = stories[index];

  if (!story) return null;

  const next = () => (index + 1 < stories.length ? setIndex(index + 1) : onClose());
  const prev = () => (index > 0 ? setIndex(index - 1) : onClose());

  return (
    <div className="viewer">
      <div className="viewer__bars">
        {stories.map((item, i) => (
          <div key={item.id} className="viewer__bar">
            <span style={{ width: i <= index ? '100%' : 0 }} />
          </div>
        ))}
      </div>

      <div className="viewer__body">
        <span className="viewer__emoji">{story.emoji}</span>
        <h2 className="viewer__title">{story.title}</h2>
        <p className="viewer__text">{story.text}</p>
        {story.score !== undefined && (
          <p className="viewer__text mono" style={{ fontSize: 40, fontWeight: 680, color: '#fff' }}>
            {story.score}<span style={{ fontSize: 18, opacity: .6 }}>/100</span>
          </p>
        )}
      </div>

      <button className="btn btn--block" onClick={onClose} style={{ background: 'rgba(255,255,255,.14)', color: '#fff' }}>
        ✕
      </button>

      <div className="viewer__nav">
        <button aria-label="prev" onClick={prev} />
        <button aria-label="next" onClick={next} />
      </div>
    </div>
  );
}
