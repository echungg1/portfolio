import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let xScale, yScale;
let commitProgress = 100;
let timeScale;
let filteredCommits = [];
let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);


async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
    }));
    let commits = d3.groups(data, (d) => d.commit);
    console.log(commits)
    return data;
  }



  function processCommits(data) {
    return d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        let first = lines[0];
        let { author, date, time, timezone, datetime } = first;
        let ret = {
          id: commit,
          url: 'https://github.com/vis-society/lab-7/commit/' + commit,
          author,
          date,
          time,
          timezone,
          datetime,
          hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
          totalLines: lines.length,
        };
  
        Object.defineProperty(ret, 'lines', {
          value: lines,
          // What other options do we need to set?
          // Hint: look up configurable, writable, and enumerable
          configurable: false,
          writable: false,
          enumerable: false
        });
  
        return ret;
      });
  }
 
  function filterCommitsByTime() {
    const commitMaxTime = timeScale.invert(commitProgress);
    filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
  }

  function renderCommitInfo(data, commits) {
    d3.select('#stats').selectAll('dl.stats').remove();

    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Add more stats as needed...
    const avgLineLength = d3.mean(data, d => d.length);
    dl.append('dt').text('Average line length (chars)');
    dl.append('dd').text(avgLineLength.toFixed(1));

    const maxLineLength = d3.max(data, d => d.length);
    dl.append('dt').text('Longest line length (chars)');
    dl.append('dd').text(maxLineLength);

    const fileCount = d3.rollups(
      data,
      v => v.length,
      d => d.file
    ).length;
    dl.append('dt').text('Number of files');
    dl.append('dd').text(fileCount);

    const fileLengths = d3.rollups(
      data,
      v => v.length,
      d => d.file
    );
    const longestFile = d3.greatest(fileLengths, d => d[1]);
    dl.append('dt').text('Longest file (lines)');
    dl.append('dd').text(`${longestFile[1]}`);
    
  }

  function createBrushSelector(svg) {
    svg.call(d3.brush());
    svg.selectAll('.dots, .overlay ~ *').raise();
    
  }

  function updateTimeDisplay() {
    commitProgress = Number(commitRange.value);
  
    const commitMaxTime = timeScale.invert(commitProgress);
  
    selectedTime.textContent = commitMaxTime.toLocaleString('en', {
      dateStyle: 'long',
      timeStyle: 'short',
    });
  
    filterCommitsByTime();

    let lines = filteredCommits.flatMap((d) => d.lines);
    let files = [];
    files = d3
      .groups(lines, (d) => d.file)
      .map(([name, lines]) => {
        return { name, lines };
      });
    files = d3.sort(files, (d) => -d.lines.length);
    updateScatterPlot(data, filteredCommits);
    renderCommitInfo(lines, filteredCommits);

    d3.select('.files').selectAll('div').remove();

    let filesContainer = d3.select('.files')
      .selectAll('div')
      .data(files)
      .enter()
      .append('div');

    filesContainer.append('dt')
      .html(d => `
        <code>${d.name}</code>
        <small>${d.lines.length} lines</small>
      `);

    filesContainer.append('dd')
      .selectAll('div')
      .data(d => d.lines)
      .join('div')
      .attr('class', 'line')
      .style('background', d => fileTypeColors(d.type));
    
      }
  

  function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
  }


  function isCommitSelected(selection, commit) {
    if (!selection) {
      return false;
    }
    // TODO: return true if commit is within brushSelection
    // and false if not
    const [x0, x1] = selection.map((d) => d[0]);
    const [y0, y1] = selection.map((d) => d[1]);
    const x = xScale(commit.datetime); 
    const y = yScale(commit.hourFrac);
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  }

  function renderSelectionCount(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
  
    const countElement = document.querySelector('#selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
  }

  // function renderScatterPlot(data, commits) {
  function updateScatterPlot(data, filteredCommits) {
    const width = 1000;
    const height = 600;

    d3.select('svg').remove();

    const svg = d3.select('#chart')
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('overflow', 'visible');
  
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
      top: margin.top,
      right: width - margin.right,
      bottom: height - margin.bottom,
      left: margin.left,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };

  
    xScale = d3.scaleTime()
      .domain(d3.extent(filteredCommits, (d) => d.datetime))
      .range([usableArea.left, usableArea.right])
      .nice();
  
    yScale = d3.scaleLinear()
      .domain([0, 24])
      .range([usableArea.bottom, usableArea.top]);

  
    const [minLines, maxLines] = d3.extent(filteredCommits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([5, 35]);
  
    const sortedCommits = d3.sort(filteredCommits, (d) => -d.totalLines);
  
    // Add gridlines BEFORE dots
    svg.append('g')
      .attr('class', 'gridlines')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
  
    svg.append('g')
      .attr('transform', `translate(0, ${usableArea.bottom})`)
      .call(d3.axisBottom(xScale));
  
    svg.append('g')
      .attr('transform', `translate(${usableArea.left}, 0)`)
      .call(d3.axisLeft(yScale).tickFormat((d) => String(d % 24).padStart(2, '0') + ':00'));

    const dots = svg.append('g').attr('class', 'dots');

    dots.selectAll('circle').remove();
  
    dots.selectAll('circle')
      .data(filteredCommits)
      .join('circle')
      .attr('cx', d => xScale(d.datetime))
      .attr('cy', d => yScale(d.hourFrac))
      .attr('r', d => rScale(d.totalLines))
      .attr('fill', 'steelblue')
      .style('fill-opacity', 0.7)
      .on('mouseenter', (event, commit) => {
        d3.select(event.currentTarget).style('fill-opacity', 1);
        renderTooltipContent(commit);
        updateTooltipVisibility(true);
        updateTooltipPosition(event);
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget).style('fill-opacity', 0.7);
        updateTooltipVisibility(false);
      });
  
    // Add brush on top
    svg.append('g')
      .attr('class', 'brush')
      .call(
        d3.brush()
          .extent([[usableArea.left, usableArea.top], [usableArea.right, usableArea.bottom]])
          .on('start brush end', brushed)
      );
  
    // Make sure dots are above brush
    svg.select('.dots').raise();
  
    function brushed(event) {
        const selection = event.selection;
        d3.selectAll('circle').classed('selected', (d) =>
          isCommitSelected(selection, d),
        );
        renderSelectionCount(selection);
        renderLanguageBreakdown(selection);
      }
  }

  let data = await loadData();
  let commits = d3.sort(processCommits(data), d => d.datetime);
  filteredCommits = commits;

  updateScatterPlot(data, commits);
  displayCommitFiles();

  renderCommitInfo(data, commits);

  let NUM_ITEMS = commits.length; // Ideally, let this value be the length of your commit history
  let ITEM_HEIGHT = 190; // Feel free to change
  let VISIBLE_COUNT = 150; // Feel free to change as well
  let totalHeight = (NUM_ITEMS - 1) * ITEM_HEIGHT;
  const scrollContainer = d3.select('#scroll-container');
  const spacer = d3.select('#spacer');
  spacer.style('height', `${totalHeight}px`);
  const itemsContainer = d3.select('#items-container');

  function renderItems(startIndex) {
    itemsContainer.selectAll('div').remove();
  
    const endIndex = Math.min(startIndex + VISIBLE_COUNT, commits.length);
    const newCommitSlice = commits.slice(0, endIndex);
    


    // updateScatterPlot(data, newCommitSlice);
    filteredCommits = newCommitSlice;

  updateScatterPlot(data, filteredCommits);

  renderCommitInfo(
    filteredCommits.flatMap(d => d.lines),
    filteredCommits
  );


  
    itemsContainer.selectAll('div')
      .data(newCommitSlice)
      .enter()
      .append('div')
      .attr('class', 'item')
      .html((d, i) => {
        const date = d.datetime.toLocaleString("en", {
          dateStyle: "full",
          timeStyle: "short"
        });
        const fileCount = d3.rollups(d.lines, D => D.length, d => d.file).length;
        const linkText = i === 0
          ? 'my initial commit'
          : `an update to refine functionality`;
      
        return `
          <p>
            On ${date}, I made
            <a href="${d.url}" target="_blank">${linkText}</a>.
            This change involved ${d.totalLines} lines across ${fileCount} file${fileCount !== 1 ? 's' : ''}, 
            aiming to improve structure, clarity, or performance. Each revision brought the project closer to stability.
          </p>
        `;
      })
      
  }


  scrollContainer.on('scroll', () => {
    const scrollTop = scrollContainer.property('scrollTop');
    let startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
    startIndex = Math.max(
      0,
      Math.min(startIndex, commits.length - VISIBLE_COUNT),
    );
    renderItems(startIndex);
    
  });
  
  // Set up the time scale
  timeScale = d3.scaleTime(
    [d3.min(commits, (d) => d.datetime), d3.max(commits, (d) => d.datetime)],
    [0, 100]
  );

  const commitRange = document.getElementById('commitRange');
  const selectedTime = document.getElementById('selectedTime');
  
  commitRange.value = commitProgress;
  
  commitRange.addEventListener('input', updateTimeDisplay);

  updateTimeDisplay();

   


   function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const time = document.getElementById('commit-time');
    const author = document.getElementById('commit-author');
    const lines = document.getElementById('commit-lines');

    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
    time.textContent = commit.time;
    author.textContent = commit.author;
    lines.textContent = commit.totalLines;
  }

  function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
  }

  function renderLanguageBreakdown(selection) {
    const selectedCommits = selection
      ? commits.filter((d) => isCommitSelected(selection, d))
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type,
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
              <dt>${language}</dt>
              <dd>${count} lines (${formatted})</dd>
          `;
    }
  }


  function displayCommitFiles() {
    const lines = filteredCommits.flatMap((d) => d.lines);
    let fileTypeColors = d3.scaleOrdinal(d3.schemeTableau10);
    let files = d3
      .groups(lines, (d) => d.file)
      .map(([name, lines]) => {
        return { name, lines };
      });
    files = d3.sort(files, (d) => -d.lines.length);
    d3.select('.files').selectAll('div').remove();
    let filesContainer = d3
      .select('.files')
      .selectAll('div')
      .data(files)
      .enter()
      .append('div');
    filesContainer
      .append('dt')
      .html(
        (d) => `<code>${d.name}</code> <small>${d.lines.length} lines</small>`,
      );
    filesContainer
      .append('dd')
      .selectAll('div')
      .data((d) => d.lines)
      .enter()
      .append('div')
      .attr('class', 'line')
      .style('background', (d) => fileTypeColors(d.type));
  }

  

  const fileScrollContainer = d3.select('#file-scroll-container');
  const fileSpacer = d3.select('#file-spacer');
  const fileItemsContainer = d3.select('#file-items-container');
  
  const FILE_ITEM_HEIGHT = 60;
  const FILE_VISIBLE_COUNT = 20;
  const fileTotalHeight = (commits.length - 1) * FILE_ITEM_HEIGHT;
  
  fileSpacer.style('height', `${fileTotalHeight}px`);
  
  fileScrollContainer.on('scroll', () => {
    const scrollTop = fileScrollContainer.property('scrollTop');
    let startIndex = Math.floor(scrollTop / FILE_ITEM_HEIGHT);
    startIndex = Math.max(0, Math.min(startIndex, commits.length - FILE_VISIBLE_COUNT));
    renderFileItems(startIndex);
  });

  function renderFileItems(startIndex) {
    fileItemsContainer.selectAll('div').remove();
  
    const endIndex = Math.min(startIndex + FILE_VISIBLE_COUNT, commits.length);
    const fileCommitSlice = commits.slice(0, endIndex);
  
    filteredCommits = fileCommitSlice;
    displayCommitFiles();

    fileItemsContainer.selectAll('div')
      .data(fileCommitSlice)
      .enter()
      .append('div')
      .attr('class', 'file-item')
      .html((d, i) => {
        const fileCount = d3.rollups(d.lines, D => D.length, d => d.file).length;
        return `
          <p>
            During commit <code>${d.id.slice(0, 7)}</code>, I modified ${fileCount} file${fileCount !== 1 ? 's' : ''},
            refining structure and adding logic.
          </p>
        `;
      });
  }
  
  
