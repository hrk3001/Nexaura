// ================================================================
// Reference solutions for every Java challenge in the registry.
//
// The judge's tests are only meaningful if they are correct. Each solution
// below is compiled and run by the REAL sandbox (server/judge.js) against
// every sample AND hidden test; any mismatch means a broken test case.
//
// Run: node test/solutions.api.test.mjs   (from server/)
// ================================================================

const HEAD = `import java.io.*;
import java.util.*;

public class Main {
`

const TAIL = `
}
`

const withIo = (body, helpers = '') => HEAD + helpers + '  public static void main(String[] args) throws Exception {\n' + body + '\n  }\n' + TAIL

const readAllInts = `    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
`

export const REFERENCE_SOLUTIONS = {
  // ---------------- ARRAY FOREST ----------------
  'java-array-max': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long best = Long.MIN_VALUE;
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) best = Math.max(best, Long.parseLong(st.nextToken()));
    System.out.println(best);`),

  'java-array-min': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long best = Long.MAX_VALUE;
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) best = Math.min(best, Long.parseLong(st.nextToken()));
    System.out.println(best);`),

  'java-array-traversal-sum': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long sum = 0;
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) sum += Long.parseLong(st.nextToken());
    System.out.println(sum);`),

  'java-array-linear-search': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long[] a = new long[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());
    long key = Long.parseLong(br.readLine().trim());
    int at = -1;
    for (int i = 0; i < n; i++) if (at == -1 && a[i] == key) at = i;
    System.out.println(at);`),

  'java-array-binary-search': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long[] a = new long[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());
    long key = Long.parseLong(br.readLine().trim());
    int lo = 0, hi = n - 1, at = -1;
    while (lo <= hi) { int mid = (lo + hi) >>> 1; if (a[mid] == key) { at = mid; break; } if (a[mid] < key) lo = mid + 1; else hi = mid - 1; }
    System.out.println(at);`),

  'java-array-reverse': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long[] a = new long[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());
    StringBuilder out = new StringBuilder();
    for (int i = n - 1; i >= 0; i--) { if (out.length() > 0) out.append(' '); out.append(a[i]); }
    System.out.println(out);`),

  'java-array-duplicates': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    HashSet<Long> seen = new HashSet<>();
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) { long v = Long.parseLong(st.nextToken()); if (!seen.add(v)) { System.out.println("true"); return; } }
    System.out.println("false");`),

  'java-array-two-pointer-pair': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long[] a = new long[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());
    long target = Long.parseLong(br.readLine().trim());
    int i = 0, j = n - 1;
    while (i < j) { long s = a[i] + a[j]; if (s == target) { System.out.println(i + " " + j); return; } if (s < target) i++; else j--; }
    System.out.println(-1);`),

  'java-array-sliding-window': withIo(`${readAllInts}    StringTokenizer first = new StringTokenizer(br.readLine());
    int n = Integer.parseInt(first.nextToken());
    int k = Integer.parseInt(first.nextToken());
    long[] a = new long[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());
    long sum = 0;
    for (int i = 0; i < k; i++) sum += a[i];
    long best = sum;
    for (int i = k; i < n; i++) { sum += a[i] - a[i - k]; best = Math.max(best, sum); }
    System.out.println(best);`),

  'java-array-prefix-sum': withIo(`${readAllInts}    StringTokenizer first = new StringTokenizer(br.readLine());
    int n = Integer.parseInt(first.nextToken());
    int q = Integer.parseInt(first.nextToken());
    long[] pre = new long[n + 1];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + Long.parseLong(st.nextToken());
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < q; i++) {
      StringTokenizer qu = new StringTokenizer(br.readLine());
      int l = Integer.parseInt(qu.nextToken()), r = Integer.parseInt(qu.nextToken());
      out.append(pre[r + 1] - pre[l]).append('\\n');
    }
    System.out.print(out);`),

  // ---------------- LINKED LIST VALLEY ----------------
  'java-ll-traversal': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    StringTokenizer st = new StringTokenizer(br.readLine());
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < n; i++) out.append(st.nextToken()).append(System.lineSeparator());
    System.out.print(out);`),

  'java-ll-singly-vs-doubly': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long[] a = new long[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int k = 0; k < n; k++) a[k] = Long.parseLong(st.nextToken());
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < n; i++) {
      if (i > 0) out.append(System.lineSeparator());
      out.append(i == 0 ? "NONE" : String.valueOf(a[i - 1])).append(' ').append(a[i]).append(' ');
      out.append(i == n - 1 ? "NONE" : String.valueOf(a[i + 1]));
    }
    System.out.print(out);`),

  'java-ll-length': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    if (n > 0) br.readLine();
    System.out.println(n);`),

  'java-ll-insert-head-tail': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long[] a = new long[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int k = 0; k < n; k++) a[k] = Long.parseLong(st.nextToken());
    StringTokenizer ht = new StringTokenizer(br.readLine());
    long head = Long.parseLong(ht.nextToken());
    long tail = Long.parseLong(ht.nextToken());
    StringBuilder out = new StringBuilder();
    out.append(head);
    for (long v : a) out.append(' ').append(v);
    out.append(' ').append(tail);
    System.out.println(out);`),

  'java-ll-delete-value': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long[] vals = new long[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) vals[i] = Long.parseLong(st.nextToken());
    long target = Long.parseLong(br.readLine().trim());
    StringBuilder out = new StringBuilder();
    boolean deleted = false;
    int kept = 0;
    for (int i = 0; i < n; i++) {
      long v = vals[i];
      if (!deleted && v == target) { deleted = true; continue; }
      if (kept++ > 0) out.append(' ');
      out.append(v);
    }
    System.out.println(kept == 0 ? "EMPTY" : out.toString());`),

  'java-ll-search': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long[] vals = new long[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) vals[i] = Long.parseLong(st.nextToken());
    long key = Long.parseLong(br.readLine().trim());
    int at = -1;
    for (int i = 0; i < n; i++) if (at == -1 && vals[i] == key) at = i;
    System.out.println(at);`),

  'java-ll-reverse': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long[] a = new long[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());
    StringBuilder out = new StringBuilder();
    for (int i = n - 1; i >= 0; i--) { if (out.length() > 0) out.append(' '); out.append(a[i]); }
    System.out.println(out);`),

  'java-ll-middle': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    StringTokenizer st = new StringTokenizer(br.readLine());
    long[] a = new long[n];
    for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());
    System.out.println(a[n / 2]);`),

  'java-ll-cycle': withIo(`${readAllInts}    StringTokenizer first = new StringTokenizer(br.readLine());
    first.nextToken();
    int pos = Integer.parseInt(first.nextToken());
    br.readLine();
    System.out.println(pos == -1 ? "false" : "true");`),

  'java-ll-doubly-adjacent': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long[] a = new long[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < n; i++) { if (i > 0) out.append(' '); out.append(a[i]); }
    out.append(System.lineSeparator());
    for (int i = n - 1; i >= 0; i--) { if (i < n - 1) out.append(' '); out.append(a[i]); }
    System.out.print(out);`),

  'java-ll-circular-shift': withIo(`${readAllInts}    StringTokenizer first = new StringTokenizer(br.readLine());
    int n = Integer.parseInt(first.nextToken());
    int k = Integer.parseInt(first.nextToken());
    long[] a = new long[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < n; i++) { if (i > 0) out.append(' '); out.append(a[(k + i) % n]); }
    System.out.println(out);`),

  'java-array-rainwater': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long[] h = new long[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) h[i] = Long.parseLong(st.nextToken());
    int lo = 0, hi = n - 1;
    long lMax = 0, rMax = 0, water = 0;
    while (lo <= hi) {
      if (h[lo] <= h[hi]) {
        lMax = Math.max(lMax, h[lo]);
        water += lMax - h[lo];
        lo++;
      } else {
        rMax = Math.max(rMax, h[hi]);
        water += rMax - h[hi];
        hi--;
      }
    }
    System.out.println(water);`),

  'java-ll-merge': withIo(`${readAllInts}    StringTokenizer first = new StringTokenizer(br.readLine());
    int n = Integer.parseInt(first.nextToken());
    int m = Integer.parseInt(first.nextToken());
    long[] a = new long[n], b = new long[m];
    StringTokenizer sa = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) a[i] = Long.parseLong(sa.nextToken());
    StringTokenizer sb = new StringTokenizer(br.readLine());
    for (int i = 0; i < m; i++) b[i] = Long.parseLong(sb.nextToken());
    int i = 0, j = 0;
    StringBuilder out = new StringBuilder();
    while (i < n || j < m) {
      long v;
      if (j >= m || (i < n && a[i] <= b[j])) v = a[i++]; else v = b[j++];
      if (out.length() > 0) out.append(' ');
      out.append(v);
    }
    System.out.println(out);`),

  'java-ll-reverse-k-group': withIo(`${readAllInts}    StringTokenizer first = new StringTokenizer(br.readLine());
    int n = Integer.parseInt(first.nextToken());
    int k = Integer.parseInt(first.nextToken());
    long[] a = new long[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());
    StringBuilder out = new StringBuilder();
    for (int start = 0; start < n; start += k) {
      int end = Math.min(start + k, n);
      if (end - start == k) { for (int i = end - 1; i >= start; i--) { if (out.length() > 0) out.append(' '); out.append(a[i]); } }
      else { for (int i = start; i < end; i++) { if (out.length() > 0) out.append(' '); out.append(a[i]); } }
    }
    System.out.println(out);`),

  // ---------------- STACK & QUEUE REALM ----------------
  'java-sq-brackets': withIo(`    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    String s = br.readLine();
    if (s == null) s = "";
    ArrayDeque<Character> st = new ArrayDeque<>();
    boolean ok = true;
    for (int i = 0; i < s.length() && ok; i++) {
      char c = s.charAt(i);
      if (c == '(' || c == '[' || c == '{') st.push(c);
      else {
        if (st.isEmpty()) { ok = false; break; }
        char o = st.pop();
        if ((c == ')' && o != '(') || (c == ']' && o != '[') || (c == '}' && o != '{')) ok = false;
      }
    }
    if (!st.isEmpty()) ok = false;
    System.out.println(ok ? "VALID" : "INVALID");`),

  'java-sq-queue-sim': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    ArrayDeque<Long> q = new ArrayDeque<>();
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < n; i++) {
      StringTokenizer st = new StringTokenizer(br.readLine());
      String op = st.nextToken();
      if (op.equals("ENQ")) q.addLast(Long.parseLong(st.nextToken()));
      else if (op.equals("DEQ")) out.append(q.isEmpty() ? -1 : q.pollFirst()).append('\\n');
      else out.append(q.isEmpty() ? -1 : q.peekFirst()).append('\\n');
    }
    System.out.print(out);`),

  'java-sq-circular-buffer': withIo(`${readAllInts}    StringTokenizer first = new StringTokenizer(br.readLine());
    int k = Integer.parseInt(first.nextToken());
    int n = Integer.parseInt(first.nextToken());
    long[] buf = new long[k];
    int head = 0, size = 0;
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < n; i++) {
      StringTokenizer st = new StringTokenizer(br.readLine());
      String op = st.nextToken();
      if (op.equals("W")) {
        long x = Long.parseLong(st.nextToken());
        if (size == k) { buf[head] = x; head = (head + 1) % k; }
        else { buf[(head + size) % k] = x; size++; }
      } else {
        if (size == 0) out.append(-1).append('\\n');
        else { out.append(buf[head]).append('\\n'); head = (head + 1) % k; size--; }
      }
    }
    if (size == 0) out.append("EMPTY");
    else for (int i = 0; i < size; i++) { if (i > 0) out.append(' '); out.append(buf[(head + i) % k]); }
    System.out.print(out);`),

  'java-sq-priority': withIo(`${readAllInts}    StringTokenizer first = new StringTokenizer(br.readLine());
    int n = Integer.parseInt(first.nextToken());
    int k = Integer.parseInt(first.nextToken());
    PriorityQueue<Long> heap = new PriorityQueue<>();
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) { heap.add(Long.parseLong(st.nextToken())); if (heap.size() > k) heap.poll(); }
    long[] top = new long[heap.size()];
    for (int i = top.length - 1; i >= 0; i--) top[i] = heap.poll();
    StringBuilder out = new StringBuilder();
    for (int i = 0; i < top.length; i++) { if (i > 0) out.append(' '); out.append(top[i]); }
    System.out.println(out);`),

  // ---------------- TREE KINGDOM ----------------
  'java-tree-inorder': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long[] val = new long[n];
    int[] left = new int[n], right = new int[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) { val[i] = Long.parseLong(st.nextToken()); left[i] = right[i] = -1; }
    ArrayDeque<Integer> q = new ArrayDeque<>();
    q.add(0);
    int next = 1;
    while (!q.isEmpty() && next < n) {
      int node = q.poll();
      int l = next++;
      if (val[l] != -1) { left[node] = l; q.add(l); }
      if (next < n) { int r = next++; if (val[r] != -1) { right[node] = r; q.add(r); } }
    }
    StringBuilder out = new StringBuilder();
    ArrayDeque<Integer> stack = new ArrayDeque<>();
    int cur = 0;
    while (cur != -1 || !stack.isEmpty()) {
      while (cur != -1) { stack.push(cur); cur = left[cur]; }
      cur = stack.pop();
      if (val[cur] != -1) { if (out.length() > 0) out.append(' '); out.append(val[cur]); }
      cur = right[cur];
    }
    System.out.println(out);`),

  'java-tree-height': HEAD + `  static long[] val;
  static int[] left, right;

  static int height(int node) {
    if (node == -1 || val[node] == -1) return -1;
    return 1 + Math.max(height(left[node]), height(right[node]));
  }

  public static void main(String[] args) throws Exception {
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    int n = Integer.parseInt(br.readLine().trim());
    val = new long[n];
    left = new int[n];
    right = new int[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) { val[i] = Long.parseLong(st.nextToken()); left[i] = right[i] = -1; }
    ArrayDeque<Integer> q = new ArrayDeque<>();
    q.add(0);
    int next = 1;
    while (!q.isEmpty() && next < n) {
      int node = q.poll();
      int l = next++;
      if (val[l] != -1) { left[node] = l; q.add(l); }
      if (next < n) { int r = next++; if (val[r] != -1) { right[node] = r; q.add(r); } }
    }
    System.out.println(height(0));
  }
}
`,

  'java-tree-bst-search': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long[] val = new long[n];
    int[] left = new int[n], right = new int[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) { val[i] = Long.parseLong(st.nextToken()); left[i] = right[i] = -1; }
    ArrayDeque<Integer> q = new ArrayDeque<>();
    q.add(0);
    int next = 1;
    while (!q.isEmpty() && next < n) {
      int node = q.poll();
      int l = next++;
      if (val[l] != -1) { left[node] = l; q.add(l); }
      if (next < n) { int r = next++; if (val[r] != -1) { right[node] = r; q.add(r); } }
    }
    long key = Long.parseLong(br.readLine().trim());
    StringBuilder path = new StringBuilder();
    int cur = 0;
    while (cur != -1) {
      if (path.length() > 0) path.append(' ');
      path.append(val[cur]);
      if (val[cur] == key) { System.out.println(path); return; }
      cur = key < val[cur] ? left[cur] : right[cur];
    }
    System.out.println("NOT FOUND");`),

  'java-tree-lca': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long[] val = new long[n];
    int[] left = new int[n], right = new int[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) { val[i] = Long.parseLong(st.nextToken()); left[i] = right[i] = -1; }
    ArrayDeque<Integer> q = new ArrayDeque<>();
    q.add(0);
    int next = 1;
    while (!q.isEmpty() && next < n) {
      int node = q.poll();
      int l = next++;
      if (val[l] != -1) { left[node] = l; q.add(l); }
      if (next < n) { int r = next++; if (val[r] != -1) { right[node] = r; q.add(r); } }
    }
    StringTokenizer uv = new StringTokenizer(br.readLine());
    long u = Long.parseLong(uv.nextToken()), v = Long.parseLong(uv.nextToken());
    int cur = 0;
    while (true) {
      if (u < val[cur] && v < val[cur]) cur = left[cur];
      else if (u > val[cur] && v > val[cur]) cur = right[cur];
      else { System.out.println(val[cur]); return; }
    }`),

  // ---------------- GRAPH CITY ----------------
  'java-graph-bfs': withIo(`${readAllInts}    StringTokenizer first = new StringTokenizer(br.readLine());
    int n = Integer.parseInt(first.nextToken()), m = Integer.parseInt(first.nextToken());
    int s = Integer.parseInt(first.nextToken()), t = Integer.parseInt(first.nextToken());
    List<Integer>[] adj = new ArrayList[n + 1];
    for (int i = 1; i <= n; i++) adj[i] = new ArrayList<>();
    for (int i = 0; i < m; i++) {
      StringTokenizer e = new StringTokenizer(br.readLine());
      int u = Integer.parseInt(e.nextToken()), v = Integer.parseInt(e.nextToken());
      adj[u].add(v); adj[v].add(u);
    }
    int[] dist = new int[n + 1];
    Arrays.fill(dist, -1);
    ArrayDeque<Integer> q = new ArrayDeque<>();
    dist[s] = 0; q.add(s);
    while (!q.isEmpty()) {
      int u = q.poll();
      for (int v : adj[u]) if (dist[v] == -1) { dist[v] = dist[u] + 1; q.add(v); }
    }
    System.out.println(dist[t]);`),

  'java-graph-components': withIo(`${readAllInts}    StringTokenizer first = new StringTokenizer(br.readLine());
    int n = Integer.parseInt(first.nextToken()), m = Integer.parseInt(first.nextToken());
    List<Integer>[] adj = new ArrayList[n + 1];
    for (int i = 1; i <= n; i++) adj[i] = new ArrayList<>();
    for (int i = 0; i < m; i++) {
      StringTokenizer e = new StringTokenizer(br.readLine());
      int u = Integer.parseInt(e.nextToken()), v = Integer.parseInt(e.nextToken());
      adj[u].add(v); adj[v].add(u);
    }
    boolean[] seen = new boolean[n + 1];
    int count = 0;
    for (int start = 1; start <= n; start++) {
      if (seen[start]) continue;
      count++;
      ArrayDeque<Integer> q = new ArrayDeque<>();
      q.add(start); seen[start] = true;
      while (!q.isEmpty()) {
        int u = q.poll();
        for (int v : adj[u]) if (!seen[v]) { seen[v] = true; q.add(v); }
      }
    }
    System.out.println(count);`),

  'java-graph-cycle': withIo(`${readAllInts}    StringTokenizer first = new StringTokenizer(br.readLine());
    int n = Integer.parseInt(first.nextToken()), m = Integer.parseInt(first.nextToken());
    List<Integer>[] adj = new ArrayList[n + 1];
    for (int i = 1; i <= n; i++) adj[i] = new ArrayList<>();
    for (int i = 0; i < m; i++) {
      StringTokenizer e = new StringTokenizer(br.readLine());
      int u = Integer.parseInt(e.nextToken()), v = Integer.parseInt(e.nextToken());
      adj[u].add(v); adj[v].add(u);
    }
    boolean[] seen = new boolean[n + 1];
    for (int start = 1; start <= n; start++) {
      if (seen[start]) continue;
      ArrayDeque<int[]> q = new ArrayDeque<>();
      q.add(new int[]{start, -1}); seen[start] = true;
      while (!q.isEmpty()) {
        int[] cur = q.poll();
        for (int v : adj[cur[0]]) {
          if (v == cur[1]) continue;
          if (seen[v]) { System.out.println("YES"); return; }
          seen[v] = true;
          q.add(new int[]{v, cur[0]});
        }
      }
    }
    System.out.println("NO");`),

  'java-graph-dfs-order': HEAD + `  static List<Integer>[] adj;
  static boolean[] seen;
  static StringBuilder out = new StringBuilder();

  static void dfs(int u) {
    seen[u] = true;
    if (out.length() > 0) out.append(' ');
    out.append(u);
    for (int v : adj[u]) if (!seen[v]) dfs(v);
  }

  public static void main(String[] args) throws Exception {
    BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
    StringTokenizer first = new StringTokenizer(br.readLine());
    int n = Integer.parseInt(first.nextToken()), m = Integer.parseInt(first.nextToken());
    adj = new ArrayList[n + 1];
    for (int i = 1; i <= n; i++) adj[i] = new ArrayList<>();
    for (int i = 0; i < m; i++) {
      StringTokenizer e = new StringTokenizer(br.readLine());
      int u = Integer.parseInt(e.nextToken()), v = Integer.parseInt(e.nextToken());
      adj[u].add(v); adj[v].add(u);
    }
    for (int i = 1; i <= n; i++) Collections.sort(adj[i]);
    seen = new boolean[n + 1];
    dfs(1);
    System.out.println(out);
  }
}
`,

  // ---------------- DYNAMIC PROGRAMMING CITADEL ----------------
  'java-dp-fib': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long a = 0, b = 1;
    for (int i = 0; i < n; i++) { long t = a + b; a = b; b = t; }
    System.out.println(a);`),

  'java-dp-coin-change': withIo(`${readAllInts}    StringTokenizer first = new StringTokenizer(br.readLine());
    int n = Integer.parseInt(first.nextToken());
    int amount = Integer.parseInt(first.nextToken());
    int[] coins = new int[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) coins[i] = Integer.parseInt(st.nextToken());
    int INF = amount + 1;
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, INF);
    dp[0] = 0;
    for (int s = 1; s <= amount; s++)
      for (int c : coins)
        if (c <= s) dp[s] = Math.min(dp[s], dp[s - c] + 1);
    System.out.println(dp[amount] >= INF ? -1 : dp[amount]);`),

  'java-dp-lis': withIo(`${readAllInts}    int n = Integer.parseInt(br.readLine().trim());
    long[] a = new long[n];
    StringTokenizer st = new StringTokenizer(br.readLine());
    for (int i = 0; i < n; i++) a[i] = Long.parseLong(st.nextToken());
    int[] dp = new int[n];
    int best = 0;
    for (int i = 0; i < n; i++) {
      dp[i] = 1;
      for (int j = 0; j < i; j++) if (a[j] < a[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
      best = Math.max(best, dp[i]);
    }
    System.out.println(best);`),

  'java-dp-grid-paths': withIo(`${readAllInts}    StringTokenizer dims = new StringTokenizer(br.readLine());
    int n = Integer.parseInt(dims.nextToken());
    int m = Integer.parseInt(dims.nextToken());
    char[][] grid = new char[n][];
    for (int i = 0; i < n; i++) grid[i] = br.readLine().trim().toCharArray();
    final int MOD = 1_000_000_007;
    long[] dp = new long[m];
    for (int r = 0; r < n; r++) {
      for (int c = 0; c < m; c++) {
        if (grid[r][c] == '#') { dp[c] = 0; continue; }
        if (r == 0 && c == 0) { dp[c] = 1; continue; }
        long fromLeft = c > 0 ? dp[c - 1] : 0;
        dp[c] = (dp[c] + fromLeft) % MOD;
      }
    }
    System.out.println(dp[m - 1] % MOD);`),
}

export const SOLUTION_COUNT = Object.keys(REFERENCE_SOLUTIONS).length
