import glob
import os
import re

transcripts_dir = 'cold-call-transcripts-100/cold-call-transcripts-100/transcripts'
files = sorted(glob.glob(os.path.join(transcripts_dir, 'T*.txt')))

def parse_transcript(text):
    lines = text.strip().split('\n')
    meta = {}
    turns = []
    in_meta = True
    for line in lines:
        line_s = line.strip()
        if not line_s:
            continue
        if line_s.startswith('#'):
            meta['id'] = line_s.replace('#', '').strip()
            continue
        if in_meta and ':' in line_s and not any(line_s.startswith(p) for p in ['CALLER:', 'PROSPECT:', 'RECEPTION:']):
            k, v = line_s.split(':', 1)
            meta[k.strip()] = v.strip()
            continue
        in_meta = False
        m = re.match(r'^(CALLER|PROSPECT|RECEPTION):\s*(.*)', line_s)
        if m:
            turns.append((m.group(1), m.group(2).strip()))
        elif turns:
            spk, prev = turns[-1]
            turns[-1] = (spk, prev + ' ' + line_s)
    return meta, turns

calls = []
for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        meta, turns = parse_transcript(f.read())
        calls.append((meta, turns))

print("=== STAGE 1: OPENING EXAMPLES ===")
for cid, txt, prev in [(m['id'], t, turns[i-1][1] if i>0 else "") for m, turns in calls for i, (s, t) in enumerate(turns) if s == 'PROSPECT' and i <= 2][:15]:
    if len(txt) > 3 and not txt.startswith('Hello'):
        print(f"[{cid}] PROSPECT: {txt}  (Prev: {prev[:40]}...)")

print("\n=== STAGE 2: PURPOSE EXAMPLES ===")
for cid, txt, prev in [(m['id'], t, turns[i-1][1] if i>0 else "") for m, turns in calls for i, (s, t) in enumerate(turns) if s == 'PROSPECT' and any(w in t.lower() for w in ['regarding', 'what company', 'what do you', 'where did you', 'what is this', 'about what', 'konsa', 'kya regarding', 'who is this'])]:
    print(f"[{cid}] PROSPECT: {txt}")

print("\n=== STAGE 3: PERMISSION EXAMPLES ===")
for cid, txt, prev in [(m['id'], t, turns[i-1][1] if i>0 else "") for m, turns in calls for i, (s, t) in enumerate(turns) if s == 'PROSPECT' and any(w in prev.lower() for w in ['right time', 'sahi time', 'speak with you', 'minute', 'good time'])]:
    print(f"[{cid}] PROSPECT: {txt}  (Asked: {prev[:50]}...)")

print("\n=== STAGE 4: THEIR BUSINESS EXAMPLES ===")
for cid, txt, prev in [(m['id'], t, turns[i-1][1] if i>0 else "") for m, turns in calls for i, (s, t) in enumerate(turns) if s == 'PROSPECT' and any(w in prev.lower() for w in ['how do you handle', 'what kind of', 'your operations', 'what products', 'how many plants', 'capacity', 'business', 'manufacture'])]:
    print(f"[{cid}] PROSPECT: {txt}  (Caller asked: {prev[:50]}...)")

print("\n=== STAGE 5: THEIR NEED IN THEIR WORDS EXAMPLES ===")
for cid, txt, prev in [(m['id'], t, turns[i-1][1] if i>0 else "") for m, turns in calls for i, (s, t) in enumerate(turns) if s == 'PROSPECT' and any(w in t.lower() for w in ['capacity', 'expanding', 'growth', 'problem', 'delay', 'cost', 'market', 'clients', 'demand', 'quality', 'supply', 'turnover', 'struggle', 'challenge', 'working capital'])]:
    if len(txt) > 20:
        print(f"[{cid}] PROSPECT: {txt}")

print("\n=== STAGE 6: OBJECTIONS EXAMPLES ===")
for cid, txt, prev in [(m['id'], t, turns[i-1][1] if i>0 else "") for m, turns in calls for i, (s, t) in enumerate(turns) if s == 'PROSPECT' and any(w in t.lower() for w in ['not interested', 'no point', 'already have', 'internal team', 'don\'t call', 'nahi chahiye', 'busy right now', 'email', 'not relevant', 'wrong person', 'left the company', 'no requirement', 'don\'t need', 'no budget', 'consultant'])]:
    print(f"[{cid}] PROSPECT: {txt}")

print("\n=== STAGE 7: NEXT STEP EXAMPLES ===")
for cid, txt, prev in [(m['id'], t, turns[i-1][1] if i>0 else "") for m, turns in calls for i, (s, t) in enumerate(turns) if s == 'PROSPECT' and any(w in t.lower() for w in ['tuesday', 'wednesday', 'thursday', 'friday', 'monday', 'after 2', 'whatsapp', 'send it on', 'share it on', 'call me next', 'email pe', 'meeting', 'calendar', 'zoom', 'google meet'])]:
    print(f"[{cid}] PROSPECT: {txt}")

print("\n=== STAGE 8: CLOSE EXAMPLES ===")
for cid, txt, prev in [(m['id'], t, turns[i-1][1] if i>0 else "") for m, turns in calls for i, (s, t) in enumerate(turns) if s == 'PROSPECT' and i >= len(turns) - 2]:
    if len(txt) > 3:
        print(f"[{cid}] PROSPECT: {txt}")
