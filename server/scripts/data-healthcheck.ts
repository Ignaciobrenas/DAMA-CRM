import { runDataHealthCheck } from '../src/utils/data-healthcheck';

async function main() {
  const result = await runDataHealthCheck();

  console.log('\n======================================================');
  console.log(`   DAMA-CRM DATA HEALTH CHECK STATUS: [ ${result.status} ]`);
  console.log('======================================================\n');
  console.log('Summary of Entity Counts:');
  console.table(result.counts);

  console.log('\nDuplicates Audit:');
  console.table(result.duplicates);

  console.log('\nReferential & Orphan Audit:');
  console.table(result.orphans);

  console.log('\nMathematical & Ledger Integrity:');
  console.table(result.integrity);

  if (result.issues.length > 0) {
    console.error(`\n⚠️  DETECTED ${result.issues.length} ISSUE(S):`);
    result.issues.forEach((iss) => console.error(`  - ${iss}`));
    process.exit(1);
  } else {
    console.log('\n✅ 100% HEALTHY: All CRM & ERP modules are consistent, zero duplicates, zero orphans.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error during data health check:', err);
  process.exit(1);
});
