import glob
import os
import re
import json

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

print(f"Total calls parsed: {len(calls)}")

# Look at caller progression:
# Stage 1 (Opening): greetings, identity check ("Am I speaking with...", "Is this...", "This is [Name] calling from Meridian Growth Partners")
# Stage 2 (Purpose): "calling regarding...", "we work with...", "we had shared the report..."
# Stage 3 (Permission): "Is this the right time to speak with you?", "Kya ye sahi time hai..."
# Stage 4 (Their business): "wanted to understand how [Company] thinks about...", "what kind of products...", "operations..."
# Stage 5 (Their need): capacity, growth challenges, pain points, expansion
# Stage 6 (Objection): "not interested", "already have someone", "send email", "back office", "call later", "wrong person"
# Stage 7 (Next step): "schedule a meeting", "Google Meet", "share the report on WhatsApp", "connect next week"
# Stage 8 (Close): "thank you", "bye", "okay"

# Let's write an analyzer that finds candidate turns for each stage and extracts quotes
stage_1_quotes = []
stage_2_quotes = []
stage_3_quotes = []
stage_4_quotes = []
stage_5_quotes = []
stage_6_quotes = []
stage_7_quotes = []
stage_8_quotes = []

for meta, turns in calls:
    cid = meta.get('id', '')
    for i, (spk, txt) in enumerate(turns):
        if spk == 'PROSPECT':
            prev_caller = turns[i-1][1] if i > 0 and turns[i-1][0] == 'CALLER' else ""
            
            # Opening: first 2 prospect turns
            if i <= 3:
                stage_1_quotes.append((cid, txt, prev_caller))
                
            # Permission check: if caller asked about time/speaking
            if any(w in prev_caller.lower() for w in ['right time', 'sahi time', 'speak with you', '2 minutes', 'minute', 'good time']):
                stage_3_quotes.append((cid, txt, prev_caller))
                
            # Purpose: caller explained purpose or prospect asked about it
            if any(w in txt.lower() for w in ['what is this regarding', 'what do you do', 'where did you get', 'what is this about', 'kya regarding', 'who is this', 'sales call']):
                stage_2_quotes.append((cid, txt, prev_caller))
            elif any(w in prev_caller.lower() for w in ['calling regarding', 'we work with', 'we help', 'growth opportunities']):
                stage_2_quotes.append((cid, txt, prev_caller))
                
            # Their business: questions about what company does / manufacturing / scale
            if any(w in prev_caller.lower() for w in ['what kind of', 'how do you handle', 'your operations', 'what products', 'how many plants', 'capacity', 'business']):
                stage_4_quotes.append((cid, txt, prev_caller))
                
            # Their need: goals, expansion, bottlenecks, challenges, or "no need"
            if any(w in prev_caller.lower() for w in ['challenges', 'bottlenecks', 'growth plans', 'pain points', 'problems that come up', 'how do you see growth']):
                stage_5_quotes.append((cid, txt, prev_caller))
            elif any(w in txt.lower() for w in ['capacity', 'raw material', 'expanding', 'margins', 'labour', 'working capital', 'no need', 'not required']):
                stage_5_quotes.append((cid, txt, prev_caller))
                
            # Objections: resistance, not interested, busy, send email, already have, do not call, wrong person
            if any(w in txt.lower() for w in ['not interested', 'no point', 'already have', 'internal team', 'don\'t call', 'nahi chahiye', 'busy right now', 'send an email', 'send on email', 'not relevant', 'wrong person', 'left the company', 'no requirement']):
                stage_6_quotes.append((cid, txt, prev_caller))
                
            # Next step: scheduling, meet, sending doc, specific day/time
            if any(w in prev_caller.lower() for w in ['schedule a meeting', 'google meet', 'connect with', 'share the report', 'send the document', 'next week']):
                stage_7_quotes.append((cid, txt, prev_caller))
            elif any(w in txt.lower() for w in ['tuesday', 'wednesday', 'thursday', 'friday', 'after 2', 'whatsapp', 'send it on', 'share it on', 'call me next']):
                stage_7_quotes.append((cid, txt, prev_caller))
                
            # Close: last 2 turns
            if i >= len(turns) - 3:
                stage_8_quotes.append((cid, txt, prev_caller))

print(f"Stage 1 candidates: {len(stage_1_quotes)}")
print(f"Stage 2 candidates: {len(stage_2_quotes)}")
print(f"Stage 3 candidates: {len(stage_3_quotes)}")
print(f"Stage 4 candidates: {len(stage_4_quotes)}")
print(f"Stage 5 candidates: {len(stage_5_quotes)}")
print(f"Stage 6 candidates: {len(stage_6_quotes)}")
print(f"Stage 7 candidates: {len(stage_7_quotes)}")
print(f"Stage 8 candidates: {len(stage_8_quotes)}")
