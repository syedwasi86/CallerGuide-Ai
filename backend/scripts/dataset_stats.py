import glob
import os
import re
import json

transcripts_dir = 'cold-call-transcripts-100/cold-call-transcripts-100/transcripts'
index_file = 'cold-call-transcripts-100/cold-call-transcripts-100/index.json'

with open(index_file, 'r', encoding='utf-8') as f:
    index_data = json.load(f)

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

parsed_calls = []
for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        meta, turns = parse_transcript(f.read())
        parsed_calls.append((meta, turns))

# Outcomes breakdown
outcomes = {}
durations = []
company_kinds = {}
for m in index_data:
    o = m['outcome']
    outcomes[o] = outcomes.get(o, 0) + 1
    durations.append(int(m['duration_seconds']))
    ck = m.get('company_kind', 'not known')
    company_kinds[ck] = company_kinds.get(ck, 0) + 1

avg_dur = sum(durations) / len(durations)
min_dur = min(durations)
max_dur = max(durations)

print(f"Total processed: {len(parsed_calls)}")
print(f"Durations: min={min_dur}s, avg={avg_dur:.1f}s, max={max_dur}s")
print(f"Outcomes: {outcomes}")
print(f"Company kinds: {company_kinds}")
