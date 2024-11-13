export function getInitialAnalysisPrompt(requirementsText) {
    return `
      You are a senior project manager and technical architect.
      Based on the following requirements, provide a detailed breakdown of project phases and associated costs.
      Consider this as the OPTIMAL timeline and budget - the maximum recommended values.
      
      For each phase:
      - Specify exact duration and timing
      - List key deliverables
      - Detail required resources
      - Consider dependencies between phases
      
      For costs:
      - Break down by category and phase
      - Include both one-time and recurring costs
      - Consider resource costs based on market rates
      - Account for tools, infrastructure, and overhead
      
      Requirements Document:
      ${requirementsText}
      
      Provide a comprehensive analysis following software development best practices.
      Ensure the phases and costs are realistic and well-structured.
    `;
  }
  
  export function getRecalculationPrompt({
    savedContext,
    timelineMonths,
    totalBudget,
    maxTimelineMonths,
    maxBudget
  }) {
    return `
      You are a senior project manager and technical architect.
      Based on the following requirements and new constraints, provide a detailed breakdown 
      of project phases and associated costs.
      
      New Constraints:
      - Timeline: ${timelineMonths} months (${monthsToWeeks(timelineMonths)} weeks)
      - Budget: ${formatCurrency(totalBudget)}
      
      These constraints are shorter/lower than the optimal values:
      - Optimal Timeline: ${maxTimelineMonths} months
      - Optimal Budget: ${formatCurrency(maxBudget)}
      
      Provide a realistic restructuring of the project that:
      1. Fits within both time and budget constraints
      2. Identifies scope adjustments needed
      3. Highlights risks and tradeoffs
      4. Maintains critical functionality
      5. Suggests process optimizations
      
      Original Requirements:
      ${savedContext}
      
      Format the response to include:
      1. Revised phase breakdown with durations
      2. Adjusted resource allocation
      3. Prioritized deliverables
      4. Risk mitigation strategies
    `;
  }