import 'package:flutter_test/flutter_test.dart';
import 'package:stackup_room/core/sync/outbox_service.dart';

/// Verifica la coda offline Hive → Supabase (Fase 8) con storage e sender finti:
/// ordine FIFO, deduplica, idempotenza dei retry.
void main() {
  group('OutboxService — coda offline', () {
    String? storage;
    final sent = <OutboxOp>[];

    setUp(() {
      storage = null;
      sent.clear();
      OutboxService.debugReadStorage = () => storage;
      OutboxService.debugWriteStorage = (raw) async => storage = raw;
      OutboxService.debugSend = (op) async => sent.add(op);
    });

    tearDown(() {
      OutboxService.debugReadStorage = null;
      OutboxService.debugWriteStorage = null;
      OutboxService.debugSend = null;
    });

    test('accoda le operazioni e le invia in ordine FIFO', () async {
      await OutboxService.queueTaskUpsert(clientId: 't1', title: 'Primo', completed: false);
      await OutboxService.queueTaskUpsert(clientId: 't2', title: 'Secondo', project: 'Acme', completed: false);
      expect(await OutboxService.pendingCount(), 2);

      final res = await OutboxService.flush();

      expect(res.sent, 2);
      expect(res.pending, 0);
      expect(res.offline, isFalse);
      expect(sent.map((o) => o.payload['client_id']), ['t1', 't2']);
      expect(sent.last.payload['project'], 'Acme');
      expect(await OutboxService.pendingCount(), 0);
    });

    test('due modifiche sullo stesso task lasciano una sola operazione (vince l’ultima)', () async {
      await OutboxService.queueTaskUpsert(clientId: 't1', title: 'Task', completed: false);
      await OutboxService.queueTaskUpsert(clientId: 't1', title: 'Task', completed: true);
      expect(await OutboxService.pendingCount(), 1);

      await OutboxService.flush();

      expect(sent, hasLength(1));
      expect(sent.single.payload['completed'], isTrue);
    });

    test('la delete sostituisce l’upsert pendente dello stesso task', () async {
      await OutboxService.queueTaskUpsert(clientId: 't1', title: 'Task', completed: false);
      await OutboxService.queueTaskDelete('t1');
      expect(await OutboxService.pendingCount(), 1);

      await OutboxService.flush();

      expect(sent.single.kind, OutboxOpKind.deleteTask);
    });

    test('lo standup è deduplicato per giorno (upsert su user_id+day)', () async {
      await OutboxService.queueStandup(day: '2026-09-13', yesterday: 'prima versione');
      await OutboxService.queueStandup(day: '2026-09-13', yesterday: 'versione corretta');
      expect(await OutboxService.pendingCount(), 1);

      await OutboxService.flush();

      expect(sent.single.payload['yesterday'], 'versione corretta');
    });

    test('se il sender fallisce (offline) la coda resta intatta e in ordine', () async {
      OutboxService.debugSend = (op) async {
        if (op.payload['client_id'] == 't2') throw StateError('offline');
        sent.add(op);
      };
      await OutboxService.queueTaskUpsert(clientId: 't1', title: 'A', completed: false);
      await OutboxService.queueTaskUpsert(clientId: 't2', title: 'B', completed: false);
      await OutboxService.queueTaskUpsert(clientId: 't3', title: 'C', completed: false);

      final res = await OutboxService.flush();

      expect(res.sent, 1);
      expect(res.pending, 2);
      expect(res.offline, isTrue);
      expect(sent.map((o) => o.payload['client_id']), ['t1']);

      final left = await OutboxService.pending();
      expect(left.map((o) => o.payload['client_id']), ['t2', 't3']);
    });

    test('al ritorno della connessione la coda residua viene svuotata', () async {
      await OutboxService.queueTaskUpsert(clientId: 't1', title: 'A', completed: false);
      OutboxService.debugSend = (op) async => throw StateError('offline');
      expect((await OutboxService.flush()).pending, 1);

      OutboxService.debugSend = (op) async => sent.add(op);
      final res = await OutboxService.flush();

      expect(res.sent, 1);
      expect(await OutboxService.pendingCount(), 0);
    });
  });
}
