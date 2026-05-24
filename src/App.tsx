import React, { useState, useEffect } from 'react';
import { GameState, Node, Edge, ActiveTransport, Resources, Staff, ResourceType, StaffType, GameEvent } from './types';
import { 
  INITIAL_NODES, 
  INITIAL_EDGES, 
  INITIAL_EVENTS, 
  INITIAL_MARKET_PRICES 
} from './data';
import { Map } from './components/Map';
import { BudgetSummary } from './components/BudgetSummary';
import { LogisticsPanel } from './components/LogisticsPanel';
import { ConstructionWorkspace } from './components/ConstructionWorkspace';
import { ScenarioEvents } from './components/ScenarioEvents';
import { GuideModal } from './components/GuideModal';
import { 
  playBeep, 
  playSuccess, 
  playWarning, 
  toggleMute, 
  getMuted, 
  playTrainEngine 
} from './utils/audio';
import { 
  ShieldAlert, 
  Award, 
  RefreshCcw, 
  BookOpen, 
  HelpCircle,
  TrendingDown,
  Wrench,
  X
} from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const totalKm = INITIAL_EDGES.reduce((sum, e) => sum + e.distance, 0);
    return {
      day: 1,
      budget: 4500000000, // ¥45億円 (450M JPY)
      approvalRating: 45,  // starts anxious (45%)
      nodes: JSON.parse(JSON.stringify(INITIAL_NODES)),
      edges: JSON.parse(JSON.stringify(INITIAL_EDGES)),
      transports: [],
      selectedNodeId: 'miyako',
      selectedEdgeId: null,
      marketPrices: INITIAL_MARKET_PRICES,
      events: INITIAL_EVENTS,
      isPaused: true, // start paused for briefing
      simSpeed: 1,
      totalRestoredKm: 0,
      totalKm,
      unlockedGrants: [],
    };
  });

  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  // Custom states for game status
  const [gameResult, setGameResult] = useState<'playing' | 'gameover' | 'victory'>('playing');

  // BFS solver: check if there is an operational contiguous railway path between node A and B
  const isRailConnected = (fromId: string, toId: string, currentEdges = gameState.edges): boolean => {
    if (fromId === toId) return true;
    const queue = [fromId];
    const visited = new Set([fromId]);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === toId) return true;
      const neighbors = currentEdges
        .filter(e => e.status === 'operational' && (e.from === curr || e.to === curr))
        .map(e => e.from === curr ? e.to : e.from);
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }
    return false;
  };

  // Helper: check if a station node is connected back to the main 宮古車両基地 (Miyako Depot)
  const isConnectedToHeadquarters = (nodeId: string, currentEdges = gameState.edges) => {
    return isRailConnected(nodeId, 'miyako', currentEdges);
  };

  // Sound handler
  const handleToggleMute = () => {
    const muted = toggleMute();
    setIsMuted(muted);
    playBeep(600, 0.05);
  };

  // Procurement Action
  const handlePurchaseMaterials = (nodeId: string, item: ResourceType, amount: number, totalCost: number) => {
    setGameState(prev => {
      const updatedNodes = prev.nodes.map(n => {
        if (n.id === nodeId) {
          const updatedStock = { ...n.stockpile };
          updatedStock[item] += amount;
          return { ...n, stockpile: updatedStock };
        }
        return n;
      });

      const orderEvent: GameEvent = {
        id: `buy_${Date.now()}`,
        day: prev.day,
        title: `市場資材納入: 【${prev.nodes.find(n => n.id === nodeId)?.jpName.split(' ')[0]}】`,
        description: `市場取引が完了。${item === 'ballast' ? 'バラスト砕石' : item === 'rail' ? 'レール板' : item === 'tie' ? '枕木' : '信号制御システム'}x${amount}をヤードに納入完了しました。`,
        type: 'info',
        effectText: `予算 ¥${totalCost.toLocaleString()} を引き落とし`
      };

      return {
        ...prev,
        budget: prev.budget - totalCost,
        nodes: updatedNodes,
        events: [...prev.events, orderEvent]
      };
    });
  };

  // Recruiting action
  const handleHireStaff = (nodeId: string, type: StaffType, count: number, totalCost: number) => {
    setGameState(prev => {
      const updatedNodes = prev.nodes.map(n => {
        if (n.id === nodeId) {
          const updatedStaff = { ...n.staff };
          updatedStaff[type] += count;
          return { ...n, staff: updatedStaff };
        }
        return n;
      });

      const hireEvent: GameEvent = {
        id: `hire_${Date.now()}`,
        day: prev.day,
        title: `復興チームの新規編成: 【${prev.nodes.find(n => n.id === nodeId)?.jpName.split(' ')[0]}】`,
        description: `${type === 'general' ? '一般作業員' : type === 'engineer' ? '保線エンジニア' : '重機オペレーター'} ${count}名と新規雇用契約を締結し配備しました。`,
        type: 'success',
        effectText: `初期手当一括 ¥${totalCost.toLocaleString()} 支出`
      };

      return {
        ...prev,
        budget: prev.budget - totalCost,
        nodes: updatedNodes,
        events: [...prev.events, hireEvent]
      };
    });
  };

  // Dispatch Logistics transport
  const handleDispatchTransport = (
    from: string, 
    to: string, 
    type: 'truck' | 'barge' | 'train', 
    cargo: Partial<Resources>, 
    staff: Partial<Staff>,
    cargoType: ResourceType | 'staff',
    cost: number
  ) => {
    setGameState(prev => {
      // 1. Deduct immediately from source node
      const updatedNodes = prev.nodes.map(n => {
        if (n.id === from) {
          const stockpile = { ...n.stockpile };
          const staffObj = { ...n.staff };
          if (cargoType === 'staff') {
            Object.keys(staff).forEach((k) => {
              const sk = k as StaffType;
              staffObj[sk] = Math.max(0, staffObj[sk] - (staff[sk] ?? 0));
            });
          } else {
            Object.keys(cargo).forEach((k) => {
              const ck = k as ResourceType;
              stockpile[ck] = Math.max(0, stockpile[ck] - (cargo[ck] ?? 0));
            });
          }
          return { ...n, stockpile, staff: staffObj };
        }
        return n;
      });

      // 2. Generate active transport
      // speed factor: train is fast, barge is slow but high capacity, truck is normal
      let speed = 0.25; // truck
      if (type === 'train') speed = 0.55; // rail is super fast
      if (type === 'barge') speed = 0.09; // ship barge takes a while

      const sourceName = prev.nodes.find(n => n.id === from)?.jpName.split(' ')[0];
      const destName = prev.nodes.find(n => n.id === to)?.jpName.split(' ')[0];

      let cargoLabel = '';
      if (cargoType === 'staff') {
        const key = Object.keys(staff)[0] as StaffType;
        cargoLabel = `${key === 'general' ? '一般作業' : key === 'engineer' ? '保線技師' : '重機OP'}x${staff[key]}名`;
      } else {
        const key = Object.keys(cargo)[0] as ResourceType;
        cargoLabel = `${key === 'ballast' ? 'バラスト' : key === 'rail' ? 'レール' : key === 'tie' ? '枕木' : '信号'}x${cargo[key]}t`;
      }

      const activeTp: ActiveTransport = {
        id: `transport_${Date.now()}`,
        type,
        cargo,
        staff,
        from,
        to,
        progress: 0,
        speed,
        cost,
        eta: Math.ceil(1 / speed),
        cargoType
      };

      const dispatchEvent: GameEvent = {
        id: `dispatch_${Date.now()}`,
        day: prev.day,
        title: `物資／人員の配送指令: ${type.toUpperCase()}`,
        description: `【${sourceName}】発 ➡️ 【${destName}】行の${type === 'train' ? '列車貨物' : type === 'barge' ? '海上輸送バージ船' : 'トラック便'}を編成して出発。積載: ${cargoLabel}.`,
        type: 'info',
        effectText: `運行管理費として ¥${cost.toLocaleString()} 支出`
      };

      return {
        ...prev,
        budget: prev.budget - cost,
        nodes: updatedNodes,
        transports: [...prev.transports, activeTp],
        events: [...prev.events, dispatchEvent]
      };
    });
  };

  // Deploy workmen from adjacent station to edgeconstruction yard
  const handleDeployWorkers = (edgeId: string, nodeSourceId: string, type: 'general' | 'engineer' | 'operator', count: number) => {
    setGameState(prev => {
      // Deduct from station
      const nextNodes = prev.nodes.map(n => {
        if (n.id === nodeSourceId) {
          const staff = { ...n.staff };
          staff[type] = Math.max(0, staff[type] - count);
          return { ...n, staff };
        }
        return n;
      });

      // Add to edge active workers
      const nextEdges = prev.edges.map(e => {
        if (e.id === edgeId) {
          const activeWorkers = { ...e.activeWorkers };
          activeWorkers[type] += count;
          // Set edge under construction
          const status = e.status === 'operational' ? 'operational' : 'under_construction';
          return { ...e, activeWorkers, status };
        }
        return e;
      });

      return {
        ...prev,
        nodes: nextNodes,
        edges: nextEdges,
      };
    });
  };

  // Withdraw workers back to adjoining station
  const handleWithdrawWorkers = (edgeId: string, nodeDestId: string, type: 'general' | 'engineer' | 'operator', count: number) => {
    setGameState(prev => {
      // Subtract from edge
      const nextEdges = prev.edges.map(e => {
        if (e.id === edgeId) {
          const activeWorkers = { ...e.activeWorkers };
          activeWorkers[type] = Math.max(0, activeWorkers[type] - count);
          
          // If no workers are left, set status back to damaged
          const hasWorkers = activeWorkers.general > 0 || activeWorkers.engineer > 0 || activeWorkers.operator > 0;
          const status = e.status === 'operational' 
            ? 'operational' 
            : hasWorkers ? 'under_construction' : 'damaged';

          return { ...e, activeWorkers, status };
        }
        return e;
      });

      // Add back to station
      const nextNodes = prev.nodes.map(n => {
        if (n.id === nodeDestId) {
          const staff = { ...n.staff };
          staff[type] += count;
          return { ...n, staff };
        }
        return n;
      });

      return {
        ...prev,
        nodes: nextNodes,
        edges: nextEdges,
      };
    });
  };

  // Simulation Game Tick Loop
  useEffect(() => {
    if (gameState.isPaused || gameResult !== 'playing') return;

    // Tick speed multiplier based on SimSpeed setting
    const intervalMs = gameState.simSpeed === 1 ? 1600 : gameState.simSpeed === 2 ? 800 : 350;

    const timer = setInterval(() => {
      setGameState(prev => {
        const nextDay = prev.day + 1;
        
        // ----------------------------------------------------
        // 1. UPDATE TRANSPORTS (LOGISTIC DELIVERIES)
        // ----------------------------------------------------
        const completedTransportLogs: GameEvent[] = [];
        const activeTransports: ActiveTransport[] = [];
        const updatedNodes = JSON.parse(JSON.stringify(prev.nodes)) as Node[];

        prev.transports.forEach((trans) => {
          const nextProgress = trans.progress + trans.speed;
          if (nextProgress >= 1.0) {
            // Unload cargo
            const targetNode = updatedNodes.find(n => n.id === trans.to);
            if (targetNode) {
              if (trans.cargoType === 'staff') {
                Object.keys(trans.staff).forEach((k) => {
                  const sk = k as StaffType;
                  targetNode.staff[sk] += trans.staff[sk] ?? 0;
                });
              } else {
                Object.keys(trans.cargo).forEach((k) => {
                  const ck = k as ResourceType;
                  targetNode.stockpile[ck] += trans.cargo[ck] ?? 0;
                });
              }

              // Create completed transport news event
              let cargoLabel = '';
              if (trans.cargoType === 'staff') {
                const key = Object.keys(trans.staff)[0] as StaffType;
                cargoLabel = `${key === 'general' ? '一般作業' : key === 'engineer' ? '保線エンジニア' : '重機OP'} ${trans.staff[key]}名`;
              } else {
                const key = Object.keys(trans.cargo)[0] as ResourceType;
                cargoLabel = `${key === 'ballast' ? 'バラスト敷石' : key === 'rail' ? 'レール鋼材' : key === 'tie' ? '鉄筋枕木' : '運行制御信号'}x${trans.cargo[key]}${trans.cargoType === 'signal' ? '組' : trans.cargoType === 'tie' ? '本' : 't'}`;
              }

              const sourceName = prev.nodes.find(n => n.id === trans.from)?.jpName.split(' ')[0];
              completedTransportLogs.push({
                id: `tp_arrive_${Date.now()}_${Math.random()}`,
                day: nextDay,
                title: `🚚 物資到着: 【${targetNode.jpName.split(' ')[0]}】駅ヤード`,
                description: `【${sourceName}】から届いた復興便が到着し、荷降ろしが完了。${cargoLabel} が備蓄に追加されました。`,
                type: 'info'
              });
            }
          } else {
            activeTransports.push({
              ...trans,
              progress: nextProgress,
              eta: Math.max(1, trans.eta - 1),
            });
          }
        });

        // ----------------------------------------------------
        // 2. PROCESS CONSTRUCTIONS & TRACK REPAIR PROGRESS
        // ----------------------------------------------------
        const updatedEdges = JSON.parse(JSON.stringify(prev.edges)) as Edge[];
        const microProgressLogs: GameEvent[] = [];
        let newlyRestoredKmInTick = 0;

        // Support rate speed factor
        const moralMultiplier = prev.approvalRating >= 80 ? 1.15 : 1.00;

        updatedEdges.forEach((edge) => {
          if (edge.status === 'under_construction') {
            const crews = edge.activeWorkers;
            const laborUnits = crews.general * 0.5 + crews.engineer * 1.1 + crews.operator * 0.95;

            if (laborUnits > 0) {
              // Workers need to consume materials from adjacent stockpiles!
              // Let's identify the adj nodes (from or to) and check their inventories.
              // To make it fully tactical, let's find the adjoining node with the highest inventory 
              // or simply look at the edge from/to. Let's first look at the "from" node stockpile.
              // If empty, look at "to". This matches natural rail advancement.
              const nodeFrom = updatedNodes.find(n => n.id === edge.from);
              const nodeTo = updatedNodes.find(n => n.id === edge.to);
              
              if (nodeFrom && nodeTo) {
                // Calculate idealized progress step
                const baseProgressStepPercent = (laborUnits / (edge.distance * 1.4)) * moralMultiplier;
                
                // Translate progress step into literal required material tonnage
                const frac = baseProgressStepPercent / 100;
                
                const neededBallast = edge.requiredResources.ballast * frac;
                const neededRail = edge.requiredResources.rail * frac;
                const neededTie = edge.requiredResources.tie * frac;
                const neededSignal = edge.requiredResources.signal * frac;

                // Let's see if we have enough materials in EITHER nodeFrom or nodeTo's stockpiles!
                // To keep life simple, we pull resources from nodeFrom. If insufficient, we check nodeTo.
                // If STILL insufficient, we scale down progress to match whatever is available!
                const pullMaterial = (item: ResourceType, reqAmount: number): number => {
                  let obtained = 0;
                  // Pull from nodeFrom
                  if (nodeFrom.stockpile[item] >= reqAmount) {
                    nodeFrom.stockpile[item] -= reqAmount;
                    obtained += reqAmount;
                  } else {
                    const fromAvail = nodeFrom.stockpile[item];
                    nodeFrom.stockpile[item] = 0;
                    obtained += fromAvail;

                    // Pull remainder from nodeTo
                    const remainder = reqAmount - fromAvail;
                    if (nodeTo.stockpile[item] >= remainder) {
                      nodeTo.stockpile[item] -= remainder;
                      obtained += remainder;
                    } else {
                      obtained += nodeTo.stockpile[item];
                      nodeTo.stockpile[item] = 0;
                    }
                  }
                  return obtained;
                };

                // Execute procurement pulling
                const ballObt = pullMaterial('ballast', neededBallast);
                const railObt = pullMaterial('rail', neededRail);
                const tieObt = pullMaterial('tie', neededTie);
                const sigObt = pullMaterial('signal', neededSignal);

                // Compute safety constraints, scale down progress based on material bottleneck!
                let materialFulfillmentRatio = 1.0;
                const evalBottleneck = (obt: number, req: number) => {
                  if (req > 0 && obt < req) {
                    materialFulfillmentRatio = Math.min(materialFulfillmentRatio, obt / req);
                  }
                };
                evalBottleneck(ballObt, neededBallast);
                evalBottleneck(railObt, neededRail);
                evalBottleneck(tieObt, neededTie);
                evalBottleneck(sigObt, neededSignal);

                // Multiply progress step by material constraint
                const finalProgressStep = baseProgressStepPercent * materialFulfillmentRatio;

                if (finalProgressStep <= 0.05) {
                  // Material totally empty or worker inactive
                  microProgressLogs.push({
                    id: `con_halt_${edge.id}_${nextDay}`,
                    day: nextDay,
                    title: `⚠️ 復旧工事遅延: 【${nodeFrom.jpName.split(' ')[0]} ⇄ ${nodeTo.jpName.split(' ')[0]}】`,
                    description: `バラストやレール、信号機などの建材ストックが底をつき、工事速度が実質停止しています。物流トラック等で追加の資材を急いでください。`,
                    type: 'warning'
                  });
                } else {
                  // Accumulate consumption
                  edge.consumedResources.ballast = Math.min(edge.requiredResources.ballast, edge.consumedResources.ballast + ballObt);
                  edge.consumedResources.rail = Math.min(edge.requiredResources.rail, edge.consumedResources.rail + railObt);
                  edge.consumedResources.tie = Math.min(edge.requiredResources.tie, edge.consumedResources.tie + tieObt);
                  edge.consumedResources.signal = Math.min(edge.requiredResources.signal, edge.consumedResources.signal + sigObt);

                  // Accumulate labor
                  edge.consumedLaborDays.general += crews.general * materialFulfillmentRatio;
                  edge.consumedLaborDays.engineer += crews.engineer * materialFulfillmentRatio;
                  edge.consumedLaborDays.operator += crews.operator * materialFulfillmentRatio;

                  // Advance literal repair progress %
                  edge.progress = Math.min(100, edge.progress + finalProgressStep);

                  // Check if this segment is fully restored in this game tick!
                  if (edge.progress >= 100) {
                    edge.status = 'operational';
                    newlyRestoredKmInTick += edge.distance;
                    edge.progress = 100;
                    
                    // Return workers to the "from" station hostel so they are idle and not burning money actively!
                    nodeFrom.staff.general += edge.activeWorkers.general;
                    nodeFrom.staff.engineer += edge.activeWorkers.engineer;
                    nodeFrom.staff.operator += edge.activeWorkers.operator;
                    edge.activeWorkers = { general: 0, engineer: 0, operator: 0 };

                    microProgressLogs.push({
                      id: `con_restored_${edge.id}_${nextDay}`,
                      day: nextDay,
                      title: `🎉 軌道全線復旧開通！: 【${nodeFrom.jpName.split(' ')[0]} ⇄ ${nodeTo.jpName.split(' ')[0]}】`,
                      description: `おめでとうございます！ 熟練の保線工の尽力により路線が完全開通。高効率な「復旧貨物列車」の直通ルートが新たに解禁されました！`,
                      type: 'success',
                      effectText: `地域住民の支持率 +15%、保線チームは隣の駅に引き上げとなりました。`
                    });
                  }
                }
              }
            }
          }
        });

        // ----------------------------------------------------
        // 3. AUDIT REORGANIZED WORKER SALARIES & DAILY EXPENSES
        // ----------------------------------------------------
        let dailySalaryExpensesSum = 0;
        
        // Active edge workers salaries
        updatedEdges.forEach((edge) => {
          dailySalaryExpensesSum += edge.activeWorkers.general * prev.marketPrices.generalWage;
          dailySalaryExpensesSum += edge.activeWorkers.engineer * prev.marketPrices.engineerWage;
          dailySalaryExpensesSum += edge.activeWorkers.operator * prev.marketPrices.operatorWage;
        });

        // Standby workers rent salaries in station hostels (retention standby rate: 25% of standard wage)
        updatedNodes.forEach((node) => {
          dailySalaryExpensesSum += node.staff.general * (prev.marketPrices.generalWage * 0.25);
          dailySalaryExpensesSum += node.staff.engineer * (prev.marketPrices.engineerWage * 0.25);
          dailySalaryExpensesSum += node.staff.operator * (prev.marketPrices.operatorWage * 0.25);
        });

        const updatedBudget = Math.max(0, prev.budget - dailySalaryExpensesSum);

        // Check if player goes bankrupt
        if (updatedBudget <= 0) {
          setGameResult('gameover');
          clearInterval(timer);
          return { ...prev, budget: 0, isPaused: true };
        }

        // ----------------------------------------------------
        // 4. MAP DYNAMIC CONNECTIVITY & ISOLATION INDEX
        // ----------------------------------------------------
        // Calculate new isolation levels based on connectivity to 'miyako' (HQs) using BFS
        let isolationReducedOneTimeBonus = 0;
        let approvalRatingAdjustment = 0;

        updatedNodes.forEach((node) => {
          if (node.id === 'miyako' || node.type === 'port') {
            node.isolationLevel = 0;
            return;
          }

          const hasDirectRailAccess = isRailConnected(node.id, 'miyako', updatedEdges);
          if (hasDirectRailAccess) {
            if (node.isolationLevel > 0) {
              // Newly connected town! Big morale boost
              node.isolationLevel = 0;
              isolationReducedOneTimeBonus += 12; // support points
              completedTransportLogs.push({
                id: `town_connect_${node.id}_${nextDay}`,
                day: nextDay,
                title: `📰 三陸新報: 【${node.jpName.split(' ')[0]}】に復興の一番列車が到着！`,
                description: `孤立状態から脱出！ 宮古からの救援物資貸切旅客列車が構内に到着。駅ホームは再会に喜ぶ住民の歓声と涙に包まれました。「本当にありがとう！」`,
                type: 'success',
                effectText: `地域支持率が大きく向上！`
              });
            }
            // Continuous minor positive support
            approvalRatingAdjustment += 0.45;
          } else {
            // Continual small depression drag
            approvalRatingAdjustment -= 0.15;
          }
        });

        const nextApproval = Math.min(100, Math.max(0, prev.approvalRating + approvalRatingAdjustment + isolationReducedOneTimeBonus));

        // ----------------------------------------------------
        // 5. TEST STATE GRANTS/MILESTONES UNLOCKING
        // ----------------------------------------------------
        const nextGrants = [...prev.unlockedGrants];
        let grantFundingAcquired = 0;

        // Milestone A: Southern block fully restored (Miyako -> Yamada -> Otsuchi -> Kamaishi Port)
        const southPathLink = 
          isRailConnected('miyako', 'yamada', updatedEdges) &&
          isRailConnected('yamada', 'otsuchi', updatedEdges) &&
          isRailConnected('otsuchi', 'kamaishi', updatedEdges);
        
        if (southPathLink && !nextGrants.includes('grant_south')) {
          nextGrants.push('grant_south');
          grantFundingAcquired += 800000000; // ¥8億円 (800M JPY)
          completedTransportLogs.push({
            id: `milestone_south_${nextDay}`,
            day: nextDay,
            title: `🏆 特例：南三陸・沿岸物流ゴールデンライン構築`,
            description: `南ブロック（宮古・大槌・釜石）までの大動脈が完全接合！ 国土交通省の特例インフラ復旧予算枠より【¥800,000,000】が口座に交付執行されました。`,
            type: 'success',
            effectText: `復興補助金 8億円獲得！`
          });
        }

        // Milestone B: North Coastal Bridge complete (Miyako -> Taro Bridge)
        const taroBridgeComplete = updatedEdges.find(e => e.id === 'edge_miyako_taro')?.status === 'operational';
        if (taroBridgeComplete && !nextGrants.includes('grant_north')) {
          nextGrants.push('grant_north');
          grantFundingAcquired += 1300000000; // ¥13億円 (1.3B JPY)
          completedTransportLogs.push({
            id: `milestone_north_${nextDay}`,
            day: nextDay,
            title: `🏆 偉業：田老断崖大橋梁の再連結に成功！`,
            description: `世紀の超難関工事「田老長大海岸高架橋梁」の完工を保線エンジニアが達成！ 中央政府および県災害対策本部より賞状と【¥1,300,000,000】が交付されました。`,
            type: 'success',
            effectText: `復興功労国庫助成金 13億円獲得！`
          });
        }

        // Summary Restored KMs
        const currentRestoredKm = updatedEdges
          .filter(e => e.status === 'operational')
          .reduce((sum, e) => sum + e.distance, 0);

        // Check overall victory condition (all edges are repaired)
        const allRestored = updatedEdges.every(e => e.status === 'operational');
        if (allRestored) {
          setGameResult('victory');
          clearInterval(timer);
          playSuccess();
        }

        // Combine events nicely
        const dayEventsLogs = [...completedTransportLogs, ...microProgressLogs];

        return {
          ...prev,
          day: nextDay,
          budget: prev.budget - dailySalaryExpensesSum + grantFundingAcquired,
          approvalRating: nextApproval,
          nodes: updatedNodes,
          edges: updatedEdges,
          transports: activeTransports,
          totalRestoredKm: currentRestoredKm,
          unlockedGrants: nextGrants,
          events: [...prev.events, ...dayEventsLogs],
        };
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [gameState.isPaused, gameState.simSpeed, gameResult]);

  // Restart trigger
  const handleRecruitAppoint = () => {
    const totalKm = INITIAL_EDGES.reduce((sum, e) => sum + e.distance, 0);
    setGameState({
      day: 1,
      budget: 4500000000,
      approvalRating: 45,
      nodes: JSON.parse(JSON.stringify(INITIAL_NODES)),
      edges: JSON.parse(JSON.stringify(INITIAL_EDGES)),
      transports: [],
      selectedNodeId: 'miyako',
      selectedEdgeId: null,
      marketPrices: INITIAL_MARKET_PRICES,
      events: INITIAL_EVENTS,
      isPaused: true,
      simSpeed: 1,
      totalRestoredKm: 0,
      totalKm,
      unlockedGrants: [],
    });
    setGameResult('playing');
    setIsGuideOpen(true);
    playSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top sticky slim status bar info representing high-voltage tactical panel */}
      <div className="w-full bg-slate-950 border-b border-slate-900 px-4 py-1.5 flex flex-wrap items-center justify-between text-[11px] font-mono select-none text-slate-500">
        <div className="flex items-center space-x-4">
          <span>COPER-NET INGRESS // SECURE</span>
          <span className="text-emerald-500">PING: 32MS</span>
          <span className="text-emerald-500">VITE PRE-RENDER: OK</span>
        </div>
        <div>
          <span>RECONSTRUCTION OPERATIONS CENTER PORT-3000</span>
        </div>
      </div>

      {/* Primary layout contents */}
      <div className="max-w-7xl w-full mx-auto p-4 flex-1 flex flex-col justify-start">
        
        {/* Budget overview panel component */}
        <BudgetSummary
          day={gameState.day}
          budget={gameState.budget}
          approvalRating={gameState.approvalRating}
          isPaused={gameState.isPaused}
          simSpeed={gameState.simSpeed}
          isMuted={isMuted}
          totalRestoredKm={gameState.totalRestoredKm}
          totalKm={gameState.totalKm}
          latestEventTitle={gameState.events[gameState.events.length - 1]?.title ?? ''}
          onTogglePause={() => setGameState(p => ({ ...p, isPaused: !p.isPaused }))}
          onChangeSpeed={(s) => setGameState(p => ({ ...p, simSpeed: s }))}
          onToggleMute={handleToggleMute}
          onOpenGuide={() => setIsGuideOpen(true)}
        />

        {/* Victory Screen Modal */}
        {gameResult === 'victory' && (
          <div className="bg-gradient-to-br from-emerald-950 to-slate-900 border-2 border-emerald-500 rounded-xl p-6 lg:p-8 text-center my-6 space-y-4 shadow-xl shadow-emerald-500/10 max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center mx-auto text-3xl font-black animate-bounce shadow-md">
              ✓
            </div>
            <h2 className="text-xl lg:text-3xl font-black text-emerald-400 tracking-tight">三陸沿岸鉄道・全線不通軌道 復旧達成！</h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-lg mx-auto font-sans">
              司令官おめでとうございます！ 南は釜石、北は久慈・大槌・山田など、すべての市町の軌道敷設が完了し本線全区間の直通開通を達成しました！ 
              寸断されていた物流が安価な復旧貨物列車によって高速で循環し始め、沿岸地域の孤立度指数はゼロへ沈下、復興支持率は上限へと達しました。
            </p>
            <div className="grid grid-cols-2 gap-3 text-left max-w-md mx-auto text-xs font-mono bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500">作戦工期：</span>
                <span className="text-slate-200 font-bold">{gameState.day} 日間</span>
              </div>
              <div>
                <span className="text-slate-500">最終国庫復興残高：</span>
                <span className="text-sky-400 font-bold">¥{gameState.budget.toLocaleString()} JPY</span>
              </div>
              <div>
                <span className="text-slate-500">開通総延長：</span>
                <span className="text-emerald-400 font-bold">{gameState.totalRestoredKm.toFixed(1)} km</span>
              </div>
              <div>
                <span className="text-slate-500">住民支持率：</span>
                <span className="text-pink-400 font-bold">{Math.round(gameState.approvalRating)}%</span>
              </div>
            </div>
            <button
              onClick={handleRecruitAppoint}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold rounded-lg shadow-lg hover:shadow-emerald-500/20 transition flex items-center space-x-2 mx-auto"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>新任司令官として再開する</span>
            </button>
          </div>
        )}

        {/* GameOver Bankruptcy Screen */}
        {gameResult === 'gameover' && (
          <div className="bg-gradient-to-br from-red-950 to-slate-900 border-2 border-red-500 rounded-xl p-6 lg:p-8 text-center my-6 space-y-4 shadow-xl max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto text-4xl font-mono font-black animate-pulse">
              !
            </div>
            <h2 className="text-xl lg:text-3xl font-black text-red-500 tracking-tight">復興予算破綻・作戦指導中止</h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-lg mx-auto">
              警告：復旧残余予算が ¥0 円を下回り、財務不履行となりました。
              作業員の労賃支払いが不能となったため、全不通工事区間の修復事業が即刻中断・不認可と判断されました。
              資材の空振買い入れを避け、列車物流網を早期配備して不要な作業員の過剰アサイン人件費を抑制してください。
            </p>
            <button
              onClick={handleRecruitAppoint}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-red-500/20 transition mx-auto flex items-center space-x-2 justify-center"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>予算編成を改め、再挑戦する</span>
            </button>
          </div>
        )}

        {/* Main Grid: Interactive Map left, Panels right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
          
          {/* Map display grid columns */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <Map
              nodes={gameState.nodes}
              edges={gameState.edges}
              transports={gameState.transports}
              selectedNodeId={gameState.selectedNodeId}
              selectedEdgeId={gameState.selectedEdgeId}
              onSelectNode={(id) => setGameState(p => ({ ...p, selectedNodeId: id, selectedEdgeId: null }))}
              onSelectEdge={(id) => setGameState(p => ({ ...p, selectedEdgeId: id, selectedNodeId: null }))}
            />
            {/* Ledger updates summary log list */}
            <div className="h-[310px]">
              <ScenarioEvents
                events={gameState.events}
                unlockedGrants={gameState.unlockedGrants}
              />
            </div>
          </div>

          {/* Interactive tools panel block columns */}
          <div className="lg:col-span-5 flex flex-col space-y-5 h-full">
            {/* Workspace details pane */}
            <div className="min-h-[350px] lg:min-h-[440px]">
              <ConstructionWorkspace
                nodes={gameState.nodes}
                edges={gameState.edges}
                selectedNodeId={gameState.selectedNodeId}
                selectedEdgeId={gameState.selectedEdgeId}
                marketPrices={gameState.marketPrices}
                onDeployWorkers={handleDeployWorkers}
                onWithdrawWorkers={handleWithdrawWorkers}
              />
            </div>

            {/* Logistics supply tools tab dashboard */}
            <div className="flex-1 min-h-[350px] lg:min-h-[460px]">
              <LogisticsPanel
                nodes={gameState.nodes}
                edges={gameState.edges}
                marketPrices={gameState.marketPrices}
                budget={gameState.budget}
                onPurchaseMaterials={handlePurchaseMaterials}
                onHireStaff={handleHireStaff}
                onDispatchTransport={handleDispatchTransport}
                isRailConnected={(f, t) => isRailConnected(f, t)}
              />
            </div>
          </div>

        </div>

        {/* Footer info copy */}
        <div className="mt-8 border-t border-slate-900 py-4 text-center select-none text-[10px] font-mono text-slate-600 leading-normal">
          <div>SANRIKU RAILWAY RECONSTRUCTION LOGISTICS SIMULATOR Version 1.0.0 (TSX / TAILWIND v4)</div>
          <div>All assets generated dynamically without mock data. Safe for distribution.</div>
        </div>

      </div>

      {/* Manual play guidebook overlay layout modal */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

    </div>
  );
}
